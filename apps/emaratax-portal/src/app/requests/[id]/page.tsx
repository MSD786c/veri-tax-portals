"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Shell, { StatusPill } from "@/components/Shell";
import { aed, getRequest, respond, useTrn, type Invoice, type RequestView, type RespondBody } from "@/lib/api";

const FIELDS = ["invoice_no", "invoice_date", "taxable_amount", "vat_amount", "total"] as const;
type Field = (typeof FIELDS)[number];
const TYPE: Record<Field, string> = { invoice_no: "text", invoice_date: "date", taxable_amount: "number", vat_amount: "number", total: "number" };
const LABEL: Record<Field, string> = { invoice_no: "Invoice no", invoice_date: "Invoice date", taxable_amount: "Taxable amount", vat_amount: "VAT amount", total: "Total" };

const Row = ({ k, v }: { k: string; v: React.ReactNode }) => (
  <div className="flex justify-between gap-4 border-b border-line py-2 text-sm"><dt className="text-muted">{k}</dt><dd className="text-end font-medium">{v}</dd></div>
);
const Yes = ({ v, set, name }: { v: boolean | null; set: (b: boolean) => void; name: string }) => (
  <div className="flex gap-6 text-sm">
    {[true, false].map((b) => (
      <label key={String(b)} className="flex items-center gap-2"><input type="radio" name={name} checked={v === b} onChange={() => set(b)} />{b ? "Yes" : "No"}</label>
    ))}
  </div>
);
const Q = ({ n, text, children }: { n: number; text: string; children: React.ReactNode }) => (
  <fieldset className="space-y-3 border-b border-line pb-5"><legend className="mb-2 font-semibold"><span className="me-2 text-gold">{n}.</span>{text}</legend>{children}</fieldset>
);

function Particulars({ inv, app }: { inv: Invoice; app: RequestView["application"] }) {
  return (
    <div className="card">
      <h2 className="mb-2 font-semibold">Invoice particulars</h2>
      <dl>
        <Row k="Invoice no" v={inv.invoice_no} /><Row k="Invoice date" v={inv.invoice_date} />
        <Row k="Description" v={inv.description} />
        <Row k="Taxable amount" v={aed(inv.taxable_amount)} /><Row k="VAT amount" v={aed(inv.vat_amount)} /><Row k="Total" v={aed(inv.total)} />
        <Row k="Applicant" v={app.applicant_name} /><Row k="Plot" v={`${app.plot_no} (${app.emirate})`} />
        <Row k="Maskan ref" v={app.maskan_ref} />
        <Row k="Invoice status" v={<StatusPill status={inv.status} />} />
      </dl>
    </div>
  );
}

function ReadOnly({ r }: { r: NonNullable<RequestView["response"]> }) {
  return (
    <div className="card">
      <h2 className="mb-2 font-semibold">Your response</h2>
      <dl>
        <Row k="Issued this invoice" v={r.issued ? "Yes" : "No (disputed)"} />
        {r.issued && <>
          <Row k="Particulars match" v={r.particulars_confirmed ? "Yes" : "No"} />
          {Object.entries(r.corrections).map(([k, v]) => <Row key={k} k={`Corrected ${k}`} v={String(v)} />)}
          <Row k="Consideration" v={r.consideration_status === "RECEIVED" ? "Received in full" : "Partly received / retention"} />
          <Row k="Amount received" v={aed(r.amount_received)} /><Row k="Received date" v={r.received_date ?? "-"} />
          <Row k="Retention" v={aed(r.retention_amount)} /><Row k="Expected release" v={r.retention_release_date ?? "-"} />
          <Row k="VAT return period" v={r.vat_return_period ?? "-"} />
        </>}
        <Row k="Declared by" v={r.declared_by} /><Row k="Declared at" v={r.declared_at.slice(0, 16).replace("T", " ")} />
      </dl>
    </div>
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
      <Link href="/" className="text-sm text-gold-dark underline">← Back to dashboard</Link>
      <h1 className="my-3 text-xl font-semibold">Confirm tax invoice {data?.invoice.invoice_no}</h1>
      {err && <p role="alert" className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-800">{err}</p>}
      {!data && !err && <p className="text-muted">Loading…</p>}
      {data && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Particulars inv={data.invoice} app={data.application} />
          {done ? (
            <div className="space-y-4">
              <div className="card flex items-center gap-3">Result: <StatusPill status={data.invoice.status} /></div>
              {data.response && <ReadOnly r={data.response} />}
            </div>
          ) : (
            <form onSubmit={submit} className="card space-y-5">
              <Q n={1} text="Did you issue this tax invoice?">
                <Yes name="issued" v={issued} set={setIssued} />
                {issued === false && <p className="text-sm text-red-700">The invoice will be submitted as disputed.</p>}
              </Q>
              {issued && <>
                <Q n={2} text="Do the particulars shown match your records?">
                  <Yes name="matches" v={matches} set={setMatches} />
                  {matches === false && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {FIELDS.map((k) => (
                        <div key={k}><label className="label" htmlFor={k}>{LABEL[k]}</label>
                          <input id={k} className="input" type={TYPE[k]} step="0.01" defaultValue={data.invoice[k]} onChange={(e) => setEdit((p) => ({ ...p, [k]: e.target.value }))} /></div>
                      ))}
                    </div>
                  )}
                </Q>
                <Q n={3} text="Consideration for this invoice">
                  <div className="space-y-2 text-sm">
                    <label className="flex items-center gap-2"><input type="radio" checked={paid === "RECEIVED"} onChange={() => setPaid("RECEIVED")} />Received in full</label>
                    <label className="flex items-center gap-2"><input type="radio" checked={paid === "PARTIAL_OR_RETENTION"} onChange={() => setPaid("PARTIAL_OR_RETENTION")} />Partly received / retention</label>
                  </div>
                  {paid === "RECEIVED" ? (
                    <div><label className="label" htmlFor="rd">Date received</label><input id="rd" type="date" className="input" value={f.received_date} onChange={(e) => set("received_date", e.target.value)} /></div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div><label className="label" htmlFor="ar">Amount received (AED)</label><input id="ar" type="number" step="0.01" className="input" value={f.amount_received} onChange={(e) => set("amount_received", e.target.value)} /></div>
                      <div><label className="label" htmlFor="ra">Amount retained (AED)</label><input id="ra" type="number" step="0.01" className="input" value={f.retention_amount} onChange={(e) => set("retention_amount", e.target.value)} /></div>
                      <div><label className="label" htmlFor="rr">Expected release date</label><input id="rr" type="date" className="input" value={f.retention_release_date} onChange={(e) => set("retention_release_date", e.target.value)} /></div>
                    </div>
                  )}
                </Q>
                <Q n={4} text="VAT return period in which this supply was declared">
                  <input aria-label="VAT return period" className="input" placeholder="2026-Q2 or Apr-2026" value={f.vat_return_period} onChange={(e) => set("vat_return_period", e.target.value)} />
                </Q>
              </>}
              <div className="space-y-3">
                <div><label className="label" htmlFor="by">Declared by (name or email)</label><input id="by" className="input" value={f.declared_by} onChange={(e) => set("declared_by", e.target.value)} /></div>
                <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1" checked={f.declaration} onChange={(e) => set("declaration", e.target.checked)} />I declare that the information provided is true and correct.</label>
                <button className="btn" disabled={!ready || busy}>{busy ? "Submitting…" : "Submit response"}</button>
              </div>
            </form>
          )}
        </div>
      )}
    </Shell>
  );
}
