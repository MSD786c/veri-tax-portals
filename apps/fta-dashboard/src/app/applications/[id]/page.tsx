"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { api, fmtAED, fmtDate, useApi, type ApplicationDetail, type InvoiceBundle } from "@/lib/api";
import { Async, Card, PageTitle, Pill, Table, Td, Th, btnCls, inputCls } from "@/components/ui";

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

function InvoiceCard({ b }: { b: InvoiceBundle }) {
  const { invoice: i, supplier: s, supplier_response: r } = b;
  return (
    <Card
      title={`Invoice ${i.invoice_no} · ${fmtAED(i.vat_amount)} VAT`}
      right={<Pill value={i.status} />}
    >
      <div className="mb-3 grid gap-x-6 gap-y-1 text-[13px] sm:grid-cols-2 lg:grid-cols-3">
        <div>Supplier: {s ? <Link className="text-sky-800 hover:underline" href={`/suppliers/${s.trn}`}>{s.legal_name}</Link> : i.supplier_trn}</div>
        <div>TRN: <span className="font-mono">{i.supplier_trn}</span></div>
        <div>Date: {i.invoice_date}</div>
        <div>Taxable: {fmtAED(i.taxable_amount)}</div>
        <div>Total: {fmtAED(i.total)}</div>
        <div>Eligible VAT: <b>{fmtAED(i.eligible_vat_amount)}</b></div>
        <div className="sm:col-span-2 lg:col-span-3">Description: {i.description}</div>
      </div>

      <h3 className="mb-1 text-xs font-semibold uppercase text-slate-500">Rule results</h3>
      <Table>
        <thead><tr><Th>Rule</Th><Th>Result</Th><Th>Evidence</Th></tr></thead>
        <tbody>
          {b.rule_results.map((rr) => (
            <tr key={rr.id}>
              <Td mono>{rr.rule_id}</Td><Td><Pill value={rr.result} /></Td>
              <Td mono>{JSON.stringify(rr.evidence)}</Td>
            </tr>
          ))}
        </tbody>
      </Table>

      <h3 className="mb-1 mt-4 text-xs font-semibold uppercase text-slate-500">Supplier response</h3>
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

            {d.invoices.map((b) => <InvoiceCard key={b.invoice.id} b={b} />)}

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
