"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, type ReactNode } from "react";
import { api, fmtAED, fmtDate, fmtPct, latestRules, useApi, type ApplicationDetail, type InvoiceBundle, type RuleResult } from "@/lib/api";
import { Async, Card, PageTitle, Pill, RatingPill, Table, Td, Th, btnCls, inputCls } from "@/components/ui";
import { OpenDocButton } from "@/components/OpenDocButton";

const FIELDS: [keyof InvoiceBundle["invoice"], string][] = [
  ["invoice_no", "Invoice no."], ["invoice_date", "Invoice date"], ["taxable_amount", "Taxable amount"],
  ["vat_amount", "VAT amount"], ["total", "Total"], ["plot_no", "Plot"],
];
const show = (k: string, v: unknown) => (v == null ? "-" : typeof v === "number" && k !== "id" ? fmtAED(v) : String(v));

// Three-way view: Maskan/invoice data vs supplier corrections. (OCR column is not exposed by the API yet.)
function Comparison({ b }: { b: InvoiceBundle }) {
  const corr = b.supplier_response?.corrections ?? {};
  const keys = new Set<string>([...FIELDS.map(([k]) => k as string), ...Object.keys(corr)]);
  return (
    <Table>
      <thead><tr><Th>Field</Th><Th>Maskan / invoice</Th><Th>Supplier response</Th><Th>Match</Th></tr></thead>
      <tbody>
        {[...keys].map((k) => {
          const inv = (b.invoice as unknown as Record<string, unknown>)[k];
          const hasCorr = k in corr;
          const sup = hasCorr ? corr[k] : b.supplier_response ? "(confirmed)" : "(no response)";
          return (
            <tr key={k} className={hasCorr ? "bg-amber-50" : ""}>
              <Td>{FIELDS.find(([f]) => f === k)?.[1] ?? k}</Td><Td>{show(k, inv)}</Td><Td>{show(k, sup)}</Td>
              <Td>{hasCorr ? <Pill value="MISMATCH" tone="red" /> : b.supplier_response ? <Pill value="OK" tone="green" /> : "-"}</Td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
}

const DECIDED = ["APPROVED", "PARTIALLY_APPROVED", "REJECTED"];
const H3 = ({ children }: { children: ReactNode }) => <h3 className="mb-1 mt-4 text-xs font-semibold uppercase text-slate-500">{children}</h3>;
const val = (v: unknown) => (v == null || v === "" ? "-" : typeof v === "object" ? JSON.stringify(v) : String(v));
type Mismatches = Record<string, { maskan: string; document: unknown }>;

// Runs an agent endpoint (synchronous, ~30-90 s) and reloads the page data afterwards.
function AgentButton({ path, label, onDone }: { path: string; label: string; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const run = async () => {
    setBusy(true);
    setErr("");
    try {
      await api(path, { method: "POST" });
      onDone();
    } catch (x) {
      setErr((x as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <button className={btnCls} onClick={run} disabled={busy}>{busy ? "Agent working… (up to ~60 s)" : label}</button>
      {err && <span className="text-xs text-red-700">Agent unavailable: {err}</span>}
    </span>
  );
}

const Advisory = ({ model }: { model: string }) => (
  <p className="mt-2 text-xs italic text-slate-500">Advisory: the officer decides. Model: <span className="font-mono">{model}</span></p>
);

function RuleEvidence({ rr }: { rr: RuleResult }) {
  const mm = rr.evidence.mismatches as Mismatches | undefined;
  if (rr.rule_id === "EX-01" && mm && Object.keys(mm).length) {
    return (
      <div className="rounded border border-red-300 bg-red-50 p-2 text-xs text-red-900">
        <b>Submitted data differs from the original document:</b>
        <ul className="mt-1">
          {Object.entries(mm).map(([k, m]) => <li key={k}><span className="font-mono">{k}</span>: Maskan <b>{m.maskan}</b> vs document <b>{val(m.document)}</b></li>)}
        </ul>
      </div>
    );
  }
  return <span className="font-mono text-xs">{JSON.stringify(rr.evidence)}</span>;
}

function DocumentPanel({ b, mismatches }: { b: InvoiceBundle; mismatches: Mismatches }) {
  const d = b.document!;
  const inv: Record<string, unknown> = { ...b.invoice, supplier_name: b.supplier?.legal_name };
  return (
    <>
      <H3>Original document</H3>
      <div className="mb-2 flex flex-wrap items-center gap-3 text-[13px]">
        <span className="font-mono">{d.filename}</span><span className="text-slate-500">{d.source}</span><Pill value={d.status} />
        {b.extraction && <Pill value={b.extraction.document_type} tone={b.extraction.document_type === "TAX_INVOICE" ? "blue" : "amber"} />}
        <OpenDocButton id={d.id} />
      </div>
      {d.error && <p className="mb-2 text-xs text-red-700">{d.error}</p>}
      {b.extraction && (
        <>
          <Table>
            <thead><tr><Th>Field</Th><Th>Read from document</Th><Th right>Confidence</Th><Th>Submitted (Maskan)</Th></tr></thead>
            <tbody>
              {Object.entries(b.extraction.fields).map(([k, f]) => {
                const bad = k in mismatches;
                const low = f.confidence < 0.7;
                return (
                  <tr key={k} className={bad ? "bg-red-50" : ""}>
                    <Td mono>{k}</Td>
                    <Td>{val(f.value)} {bad && <Pill value="MISMATCH" tone="red" />}</Td>
                    <Td right><span className={low ? "rounded bg-amber-100 px-1 font-semibold text-amber-800" : ""}>{fmtPct(f.confidence)}</span></Td>
                    <Td>{k in inv ? val(inv[k]) : "-"}</Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
          <p className="mt-1 text-xs text-slate-500">Extracted by <span className="font-mono">{b.extraction.model}</span> ({b.extraction.prompt_version}). Confidence below 70% is highlighted.</p>
        </>
      )}
    </>
  );
}

function InvoiceDecisionForm({ i, onDone }: { i: InvoiceBundle["invoice"]; onDone: () => void }) {
  const [decision, setDecision] = useState("APPROVED");
  const [amount, setAmount] = useState(String(i.suggested_eligible_vat ?? i.eligible_vat_amount));
  const [comment, setComment] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      await api(`/fta/invoices/${i.id}/decision`, {
        method: "POST",
        body: JSON.stringify({ decision, comment, ...(decision === "APPROVED" && { approved_vat_amount: Number(amount) }) }),
      });
      onDone();
    } catch (x) {
      setErr((x as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-2">
      <label className="grid gap-1 text-xs font-semibold text-slate-600">Decision
        <select className={inputCls} value={decision} onChange={(e) => setDecision(e.target.value)}>
          <option>APPROVED</option><option>REJECTED</option>
        </select>
      </label>
      <label className="grid gap-1 text-xs font-semibold text-slate-600">Approved VAT (AED)
        <input className={`${inputCls} w-32`} type="number" min={0} max={i.vat_amount} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} disabled={decision === "REJECTED"} />
      </label>
      <label className="grid min-w-48 flex-1 gap-1 text-xs font-semibold text-slate-600">Comment
        <input className={inputCls} value={comment} onChange={(e) => setComment(e.target.value)} />
      </label>
      <button className={btnCls} disabled={busy}>{busy ? "Saving…" : "Record decision"}</button>
      {err && <p className="w-full text-red-700">{err}</p>}
    </form>
  );
}

function InvoiceCard({ b, rules, decided, reload }: { b: InvoiceBundle; rules: Record<string, string>; decided: boolean; reload: () => void }) {
  const { invoice: i, supplier: s, supplier_response: r } = b;
  const latest = latestRules(b.rule_results);
  const ex01 = latest.find((x) => x.rule_id === "EX-01");
  const mismatches = (ex01?.evidence.mismatches ?? {}) as Mismatches;
  const od = b.officer_decision;
  return (
    <Card
      title={`Invoice ${i.invoice_no} · ${fmtAED(i.vat_amount)} VAT`}
      right={<span className="flex flex-wrap gap-1"><RatingPill rating={i.rating} /><Pill value={i.status} /></span>}
    >
      <div className="mb-3 grid gap-x-6 gap-y-1 text-[13px] sm:grid-cols-2 lg:grid-cols-3">
        <div>Supplier: {s ? <Link className="text-sky-800 hover:underline" href={`/suppliers/${s.trn}`}>{s.legal_name}</Link> : i.supplier_trn}</div>
        <div>TRN: <span className="font-mono">{i.supplier_trn}</span></div>
        <div>Supplier trust: {b.supplier_trust ? <><Pill value={b.supplier_trust.tier} tone={b.supplier_trust.tier === "TRUSTED" ? "green" : b.supplier_trust.tier === "WATCH" ? "red" : "grey"} /> <span className="text-xs text-slate-500">{b.supplier_trust.confirmed} confirmed · {b.supplier_trust.corrected} corrected · {b.supplier_trust.disputed} disputed · {b.supplier_trust.no_response} no response</span></> : "-"}</div>
        <div>Date: {i.invoice_date}</div>
        <div>Taxable: {fmtAED(i.taxable_amount)}</div>
        <div>Total: {fmtAED(i.total)}</div>
        <div>Invoice type: {i.invoice_type ?? "-"}</div>
        <div>Recipient: {i.recipient_name || "-"}</div>
        <div>Eligible VAT: <b>{fmtAED(i.eligible_vat_amount)}</b></div>
        <div>Suggested eligible VAT: <b>{fmtAED(i.suggested_eligible_vat)}</b></div>
        <div className="sm:col-span-2 lg:col-span-3">Description: {i.description}</div>
      </div>

      <div className={`rounded border p-3 text-[13px] ${i.rating === "FAIL" ? "border-red-200 bg-red-50" : i.rating === "WEAK" ? "border-amber-200 bg-amber-50" : i.rating === "STRONG" ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-slate-50"}`}>
        <div className="mb-1 flex items-center gap-2 font-semibold">Rating <RatingPill rating={i.rating} /></div>
        {i.rating_reasons.length > 0 ? <ul className="list-disc pl-5">{i.rating_reasons.map((x) => <li key={x}>{x}</li>)}</ul> : <p className="text-slate-500">No rating yet: waiting for the supplier step.</p>}
        {i.fix_guidance.length > 0 && (
          <>
            <div className="mt-2 font-semibold">Fix guidance (shown to the applicant)</div>
            <ul className="list-disc pl-5">{i.fix_guidance.map((x) => <li key={x}>{x}</li>)}</ul>
          </>
        )}
      </div>

      <H3>Officer decision on this invoice</H3>
      {od ? (
        <p className="text-[13px]">
          <Pill value={od.decision} /> {fmtAED(od.approved_vat_amount)} by <b>{od.officer_id}</b> at {fmtDate(od.decided_at)}
          {od.overrode_agent && <> · <Pill value={`OVERRODE ${od.agent_rating}`} tone="amber" /></>}
          {od.comment && <span className="text-slate-600"> · “{od.comment}”</span>}
        </p>
      ) : decided ? <p className="text-slate-500">No invoice-level decision; the application is already decided.</p> : <InvoiceDecisionForm i={i} onDone={reload} />}

      <H3>Rule results (latest per rule)</H3>
      <Table>
        <thead><tr><Th>Rule</Th><Th>Description</Th><Th>Result</Th><Th>Evidence</Th></tr></thead>
        <tbody>
          {latest.map((rr) => (
            <tr key={rr.rule_id} className={rr.result === "FAIL" ? "bg-red-50/50" : rr.result === "UNCERTAIN" ? "bg-amber-50/50" : ""}>
              <Td mono><span className="whitespace-nowrap">{rr.rule_id}</span></Td><Td>{rules[rr.rule_id] ?? "-"}</Td><Td><Pill value={rr.result} /></Td>
              <Td><RuleEvidence rr={rr} /></Td>
            </tr>
          ))}
        </tbody>
      </Table>

      {b.document && <DocumentPanel b={b} mismatches={mismatches} />}

      {b.precedents.length > 0 && (
        <>
          <H3>Precedents (past officer decisions on similar invoices)</H3>
          <ul className="text-[13px]">
            {b.precedents.map((p) => (
              <li key={p.id}>
                <Pill value={p.decision} /> invoice #{p.invoice_id} · agent rated <RatingPill rating={p.agent_rating} />{p.overrode_agent && " (overridden)"} · rules <span className="font-mono">{p.signature || "-"}</span> · {p.officer_id}, {fmtDate(p.decided_at)}{p.comment && ` · “${p.comment}”`}
              </li>
            ))}
          </ul>
        </>
      )}

      <H3>Compliance agent</H3>
      {b.agent_runs.filter((a) => a.kind === "compliance").map((a) => (
        <div key={a.id} className="mb-2 rounded border border-sky-200 bg-sky-50 p-3 text-[13px]">
          <div className="text-xs text-slate-500">{fmtDate(a.at)}</div>
          {a.error ? <p className="text-red-700">{a.error}</p> : (
            <>
              <ul className="list-disc pl-5">
                {a.output?.recommendations?.map((x, n) => <li key={n}><span className="font-mono">{x.rule_id}</span> <Pill value={x.recommendation} />: {x.reason}</li>)}
              </ul>
              {a.output?.eligible_goods != null && <p className="mt-1">Eligible goods: <b>{a.output.eligible_goods ? "Yes" : "No"}</b></p>}
              {a.output?.notes && <p className="mt-1 text-slate-700">{a.output.notes}</p>}
            </>
          )}
          <Advisory model={a.model} />
        </div>
      ))}
      <AgentButton path={`/fta/invoices/${i.id}/compliance`} label="Ask compliance agent" onDone={reload} />

      <H3>Supplier response</H3>
      {r ? (
        <ul className="mb-3 text-[13px]">
          <li>Issued: {r.issued ? "Yes" : "No"} · Particulars confirmed: {r.particulars_confirmed ? "Yes" : "No"}</li>
          <li>Consideration: {r.consideration_status ?? "-"} · Received: {fmtAED(r.amount_received)} · Retention: {fmtAED(r.retention_amount)}</li>
          <li>VAT return period: {r.vat_return_period ?? "-"} · Declared by {r.declared_by} at {fmtDate(r.declared_at)}</li>
        </ul>
      ) : (
        <p className="mb-3 text-slate-500">No response yet{b.confirmation_request ? ` (request ${b.confirmation_request.status}, due ${fmtDate(b.confirmation_request.due_at)})` : ""}.</p>
      )}
      <Comparison b={b} />
    </Card>
  );
}

function Brief({ d, reload }: { d: ApplicationDetail; reload: () => void }) {
  const runs = d.agent_runs.filter((a) => a.kind === "reconciliation");
  const a = runs[0]; // newest first
  const o = a?.output;
  return (
    <Card title="Decision brief (reconciliation agent)" right={<AgentButton path={`/fta/applications/${d.application.id}/summary`} label="Generate decision brief" onDone={reload} />}>
      {!a ? <p className="text-slate-500">No brief generated yet.</p> : a.error ? <p className="text-red-700">{a.error}</p> : (
        <div className="space-y-2 text-[13px]">
          <p>Recommended: {o?.recommended_decision ? <Pill value={o.recommended_decision} /> : "-"} <b>{fmtAED(o?.recommended_amount)}</b> <span className="text-xs text-slate-500">· {fmtDate(a.at)}{runs.length > 1 && ` · ${runs.length} briefs, showing the latest`}</span></p>
          {o?.summary && <p>{o.summary}</p>}
          {!!o?.reasons?.length && <div><b>Reasons</b><ul className="list-disc pl-5">{o.reasons.map((x) => <li key={x}>{x}</li>)}</ul></div>}
          {!!o?.risks?.length && <div><b>Risks</b><ul className="list-disc pl-5">{o.risks.map((x) => <li key={x}>{x}</li>)}</ul></div>}
          {!!o?.follow_up?.length && <div><b>Follow-up</b><ul className="list-disc pl-5">{o.follow_up.map((x) => <li key={x}>{x}</li>)}</ul></div>}
        </div>
      )}
      {a && <Advisory model={a.model} />}
    </Card>
  );
}

function DecisionForm({ id, suggested, onDone }: { id: number; suggested: number; onDone: () => void }) {
  const [decision, setDecision] = useState("APPROVED");
  const [amount, setAmount] = useState(String(suggested));
  const [comments, setComments] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      await api(`/fta/applications/${id}/decision`, {
        method: "POST",
        body: JSON.stringify({ decision, approved_amount: decision === "REJECTED" ? 0 : Number(amount), comments }),
      });
      onDone();
    } catch (x) {
      setErr((x as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card title="Officer decision">
      <form onSubmit={submit} className="grid max-w-xl gap-3">
        <label className="grid gap-1 text-xs font-semibold text-slate-600">Decision
          <select className={inputCls} value={decision} onChange={(e) => setDecision(e.target.value)}>
            <option>APPROVED</option><option>PARTIALLY_APPROVED</option><option>REJECTED</option>
          </select>
        </label>
        <label className="grid gap-1 text-xs font-semibold text-slate-600">Approved amount (AED) · suggested {fmtAED(suggested)}
          <input className={inputCls} type="number" min={0} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} disabled={decision === "REJECTED"} />
        </label>
        <label className="grid gap-1 text-xs font-semibold text-slate-600">Comments
          <textarea className={inputCls} rows={3} value={comments} onChange={(e) => setComments(e.target.value)} />
        </label>
        {err && <p className="text-red-700">{err}</p>}
        <div><button className={btnCls} disabled={busy}>{busy ? "Submitting…" : "Submit decision"}</button></div>
      </form>
    </Card>
  );
}

export default function ApplicationPage() {
  const { id } = useParams<{ id: string }>();
  const { data: d, loading, error, reload } = useApi<ApplicationDetail>(`/fta/applications/${id}`);
  const { data: rules } = useApi<{ rules: Record<string, string> }>("/rules");
  const decided = !!d && (!!d.decision || DECIDED.includes(d.application.status));
  return (
    <>
      <PageTitle>Application {d?.application.maskan_ref ?? ""}</PageTitle>
      <Async loading={loading} error={error}>
        {d && (
          <div className="space-y-4">
            <Card title="Applicant" right={<Pill value={d.application.status} />}>
              <div className="grid gap-1 text-[13px] sm:grid-cols-2 lg:grid-cols-3">
                <div>Applicant: <b>{d.application.applicant_name}</b></div>
                <div>Emirate: {d.application.emirate}</div>
                <div>Claim type: {d.application.claim_type}</div>
                <div>Plot: <span className="font-mono">{d.application.plot_no}</span></div>
                <div>Completion date: {d.application.completion_date}</div>
                <div>Submitted: {fmtDate(d.application.submitted_at)}</div>
              </div>
            </Card>

            {d.application.flags?.length > 0 && (
              <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-[13px] text-amber-900" role="alert">
                <b>Application warnings</b>
                <ul className="list-disc pl-5">{d.application.flags.map((f) => <li key={f}>{f}</li>)}</ul>
              </div>
            )}

            <Brief d={d} reload={reload} />

            {d.invoices.map((b) => <InvoiceCard key={b.invoice.id} b={b} rules={rules?.rules ?? {}} decided={decided} reload={reload} />)}

            {d.decision ? (
              <Card title="Decision">
                <p><Pill value={d.decision.decision} /> {fmtAED(d.decision.approved_amount)} by <b>{d.decision.officer_id}</b> at {fmtDate(d.decision.decided_at)}</p>
                {d.decision.comments && <p className="mt-2 text-slate-600">“{d.decision.comments}”</p>}
              </Card>
            ) : d.application.status === "READY_FOR_DECISION" ? (
              <DecisionForm id={d.application.id} suggested={d.invoices.reduce((s, b) => s + b.invoice.eligible_vat_amount, 0)} onDone={reload} />
            ) : null}

            <Card title="Audit trail">
              <Table>
                <thead><tr><Th>When</Th><Th>Actor</Th><Th>Action</Th><Th>Entity</Th><Th>Detail</Th></tr></thead>
                <tbody>
                  {d.audit.map((a) => (
                    <tr key={a.id}><Td>{fmtDate(a.at)}</Td><Td>{a.actor}</Td><Td>{a.action}</Td><Td mono>{a.entity}</Td><Td mono>{JSON.stringify(a.detail)}</Td></tr>
                  ))}
                </tbody>
              </Table>
            </Card>
          </div>
        )}
      </Async>
    </>
  );
}
