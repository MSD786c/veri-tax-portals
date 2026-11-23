"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Shell, { Icon, StatusPill } from "@/components/Shell";
import { aed, getRequest, respond, useTrn, type Invoice, type RequestView, type RespondBody } from "@/lib/api";

const FIELDS = ["invoice_no", "invoice_date", "taxable_amount", "vat_amount", "total"] as const;
type Field = (typeof FIELDS)[number];
const TYPE: Record<Field, string> = { invoice_no: "text", invoice_date: "date", taxable_amount: "number", vat_amount: "number", total: "number" };
const LABEL: Record<Field, string> = { invoice_no: "Invoice no", invoice_date: "Invoice date", taxable_amount: "Taxable amount", vat_amount: "VAT amount", total: "Total" };

const fdate = (s: string) => new Date(s.slice(0, 10) + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const KV = ({ k, v, wide }: { k: string; v: React.ReactNode; wide?: boolean }) => (
  <div className={wide ? "wide" : undefined}><dt>{k}</dt><dd>{v}</dd></div>
);
const Yes = ({ v, set, name }: { v: boolean | null; set: (b: boolean) => void; name: string }) => (
  <div className="yn">
    {[true, false].map((b) => (
      <label key={String(b)} className={v === b ? "on" : ""}><input type="radio" className="sr" name={name} checked={v === b} onChange={() => set(b)} />{b ? "Yes" : "No"}</label>
    ))}
  </div>
);
const Q = ({ n, text, children }: { n: number; text: string; children: React.ReactNode }) => (
  <fieldset className="qq"><legend><span className="qq-n">{n}</span><span>{text}</span></legend><div className="qq-b">{children}</div></fieldset>
);

// Suppliers see only what was submitted, never the FTA's internal assessment (rating, reasons, eligible VAT).
function Particulars({ inv, app, status }: { inv: Invoice; app: RequestView["application"]; status: string }) {
  const items = inv.line_items ?? [];
  return (
    <section className="card">
      <header className="card-h"><h2>Invoice particulars</h2><StatusPill status={status} /></header>
      <dl className="amts">
        <div><dt>Taxable amount</dt><dd>{aed(inv.taxable_amount)}</dd></div>
        <div><dt>VAT</dt><dd>{aed(inv.vat_amount)}</dd></div>
        <div className="total"><dt>Total</dt><dd>{aed(inv.total)}</dd></div>
      </dl>
      <dl className="kv">
        <KV k="Invoice no" v={inv.invoice_no} />
        <KV k="Invoice date" v={fdate(inv.invoice_date)} />
        {inv.supply_date && <KV k="Supply date" v={fdate(inv.supply_date)} />}
        <KV k="Maskan ref" v={app.maskan_ref} />
        <KV k="Applicant" v={app.applicant_name} />
        <KV k="Plot" v={`${app.plot_no} (${app.emirate})`} />
        {inv.recipient_name && <KV k="Recipient" v={inv.recipient_name} />}
        {inv.recipient_address && <KV k="Recipient address" v={inv.recipient_address} />}
        {inv.supplier_address && <KV k="Supplier address" v={inv.supplier_address} wide />}
        <KV k="Description" v={inv.description} wide />
      </dl>
      {items.length > 0 && (
        <>
          <h3 className="sec">Line items</h3>
          <div className="tbl-wrap items">
            <table className="tbl static">
              <thead>
                <tr><th>Description</th><th className="num">Qty</th><th className="num">Unit price</th><th className="num">Amount</th></tr>
              </thead>
              <tbody>
                {items.map((l, n) => (
                  <tr key={n}>
                    <td className="desc">{l.description}</td>
                    <td className="num">{l.quantity ?? "-"}</td>
                    <td className="num">{aed(l.unit_price)}</td>
                    <td className="num">{aed(l.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}

const CLOSED: Record<string, string> = {
  EXPIRED: "The time limit for this confirmation has passed. The request is closed and can no longer be answered.",
  CANCELLED: "This request was withdrawn by the FTA. No action is needed from you.",
};

function ReadOnly({ r }: { r: NonNullable<RequestView["response"]> }) {
  return (
    <section className="card">
      <header className="card-h"><h2>Your response</h2></header>
      <dl className="kv">
        <KV k="Issued this invoice" v={r.issued ? "Yes" : "No (disputed)"} />
        {r.issued && <>
          <KV k="Particulars match" v={r.particulars_confirmed ? "Yes" : "No"} />
          {Object.entries(r.corrections).map(([k, v]) => <KV key={k} k={`Corrected ${k.replace(/_/g, " ")}`} v={String(v)} />)}
          <KV k="Consideration" v={r.consideration_status === "RECEIVED" ? "Received in full" : "Partly received / retention"} />
          <KV k="Amount received" v={aed(r.amount_received)} /><KV k="Received date" v={r.received_date ?? "-"} />
          <KV k="Retention" v={aed(r.retention_amount)} /><KV k="Expected release" v={r.retention_release_date ?? "-"} />
          <KV k="VAT return period" v={r.vat_return_period ?? "-"} />
        </>}
        <KV k="Declared by" v={r.declared_by} /><KV k="Declared at" v={r.declared_at.slice(0, 16).replace("T", " ")} />
      </dl>
    </section>
  );
}

export default function RequestPage() {
  const { id } = useParams<{ id: string }>();
  const trn = useTrn();
  const [data, setData] = useState<RequestView | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [issued, setIssued] = useState<boolean | null>(null);
  const [matches, setMatches] = useState<boolean | null>(null);
  const [edit, setEdit] = useState<Record<string, string>>({});
  const [paid, setPaid] = useState<"RECEIVED" | "PARTIAL_OR_RETENTION">("RECEIVED");
  const [f, setF] = useState({ received_date: "", amount_received: "", retention_amount: "", retention_release_date: "", vat_return_period: "", declared_by: "", declaration: false });
  const set = (k: keyof typeof f, v: string | boolean) => setF((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    if (trn) getRequest(id).then(setData).catch((e) => setErr(e.message));
  }, [trn, id]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!data) return;
    setErr(""); setBusy(true);
    const inv = data.invoice;
    const body: RespondBody = { issued: !!issued, particulars_confirmed: false, corrections: {}, declared_by: f.declared_by, declaration: f.declaration };
    if (issued) {
      body.particulars_confirmed = !!matches;
      if (matches === false)
        for (const k of FIELDS) {
          const raw = edit[k];
          if (raw === undefined || raw === "") continue;
          const v = TYPE[k] === "number" ? Number(raw) : raw;
          if (v !== inv[k]) body.corrections[k] = v;
        }
      body.consideration_status = paid;
      if (paid === "RECEIVED") { if (f.received_date) body.received_date = f.received_date; body.amount_received = inv.total; }
      else {
        if (f.amount_received) body.amount_received = Number(f.amount_received);
        if (f.retention_amount) body.retention_amount = Number(f.retention_amount);
        if (f.retention_release_date) body.retention_release_date = f.retention_release_date;
      }
      if (f.vat_return_period) body.vat_return_period = f.vat_return_period;
    }
    try { setData(await respond(data.request.id, body)); }
    catch (x) { setErr((x as Error).message); }
    setBusy(false);
  }

  const ready = issued !== null && (!issued || (matches !== null && !!f.vat_return_period)) && !!f.declared_by && f.declaration;
  const done = data && data.request.status !== "PENDING";

  return (
    <Shell>
      <Link href="/" className="link-more back"><Icon n="chevl" s={16} />Back to dashboard</Link>
      <header className="page-h">
        <div>
          <p className="eyebrow">VAT refund confirmation{data && ` · Due ${fdate(data.request.due_at)}`}</p>
          <h1>Confirm tax invoice {data?.invoice.invoice_no}</h1>
          <p className="lead">Review the particulars submitted by the applicant and answer the questions below.</p>
        </div>
      </header>
      {err && <p role="alert" className="err banner">{err}</p>}
      {!data && !err && <p className="muted center">Loading request…</p>}
      {data && (
        <div className="req-grid">
          <Particulars inv={data.invoice} app={data.application} status={data.request.status} />
          {done ? (
            <div className="req-side">
              <div role="status" className={`verdict ${data.request.status === "RESPONDED" ? "approved" : ""}`}>
                <div className="verdict-top"><div><h3>{CLOSED[data.request.status] ? "Request closed" : "Response submitted"}</h3>
                  <p className="muted">{CLOSED[data.request.status] ?? "Thank you, your response has been submitted to the FTA."}</p></div>
                  <StatusPill status={data.request.status} /></div>
              </div>
              {data.response && <ReadOnly r={data.response} />}
            </div>
          ) : (
            <form onSubmit={submit} className="card confirm">
              <header className="card-h"><h2>Supplier confirmation</h2><small className="muted">{issued === false ? "1 question" : "4 questions"}</small></header>
              <Q n={1} text="Did you issue this tax invoice?">
                <Yes name="issued" v={issued} set={setIssued} />
                {issued === false && <p className="note bad">The invoice will be submitted as disputed.</p>}
              </Q>
              {issued && <>
                <Q n={2} text="Do the particulars shown match your records?">
                  <Yes name="matches" v={matches} set={setMatches} />
                  {matches === false && (
                    <div className="grid2">
                      {FIELDS.map((k) => (
                        <div key={k} className="field"><label htmlFor={k}>{LABEL[k]}</label>
                          <input id={k} type={TYPE[k]} step="0.01" defaultValue={data.invoice[k]} onChange={(e) => setEdit((p) => ({ ...p, [k]: e.target.value }))} /></div>
                      ))}
                    </div>
                  )}
                </Q>
                <Q n={3} text="Consideration for this invoice">
                  <div className="yn">
                    <label className={paid === "RECEIVED" ? "on" : ""}><input type="radio" className="sr" name="paid" checked={paid === "RECEIVED"} onChange={() => setPaid("RECEIVED")} />Received in full</label>
                    <label className={paid === "PARTIAL_OR_RETENTION" ? "on" : ""}><input type="radio" className="sr" name="paid" checked={paid === "PARTIAL_OR_RETENTION"} onChange={() => setPaid("PARTIAL_OR_RETENTION")} />Partly received / retention</label>
                  </div>
                  {paid === "RECEIVED" ? (
                    <div className="field"><label htmlFor="rd">Date received</label><input id="rd" type="date" value={f.received_date} onChange={(e) => set("received_date", e.target.value)} /></div>
                  ) : (
                    <div className="grid2">
                      <div className="field"><label htmlFor="ar">Amount received (AED)</label><input id="ar" type="number" step="0.01" value={f.amount_received} onChange={(e) => set("amount_received", e.target.value)} /></div>
                      <div className="field"><label htmlFor="ra">Amount retained (AED)</label><input id="ra" type="number" step="0.01" value={f.retention_amount} onChange={(e) => set("retention_amount", e.target.value)} /></div>
                      <div className="field"><label htmlFor="rr">Expected release date</label><input id="rr" type="date" value={f.retention_release_date} onChange={(e) => set("retention_release_date", e.target.value)} /></div>
                    </div>
                  )}
                </Q>
                <Q n={4} text="VAT return period in which this supply was declared">
                  <div className="field"><input aria-label="VAT return period" placeholder="2026-Q2 or Apr-2026" value={f.vat_return_period} onChange={(e) => set("vat_return_period", e.target.value)} /></div>
                </Q>
              </>}
              <div className="declare">
                <div className="field"><label htmlFor="by">Declared by (name or email)</label><input id="by" value={f.declared_by} onChange={(e) => set("declared_by", e.target.value)} /></div>
                <label className="check"><input type="checkbox" checked={f.declaration} onChange={(e) => set("declaration", e.target.checked)} /><span>I declare that the information provided is true and correct.</span></label>
                <button className="btn primary lg" disabled={!ready || busy}><span>{busy ? "Submitting…" : "Submit response"}</span>{!busy && <Icon n="arrow" s={18} />}</button>
              </div>
            </form>
          )}
        </div>
      )}
    </Shell>
  );
}
