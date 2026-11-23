"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import Shell, { StatusPill } from "@/components/Shell";
import { aed, listRequests, useTrn, type RequestStatus, type RequestView } from "@/lib/api";

type Tab = "PENDING" | "RESPONDED" | "CLOSED";
const TABS: Record<Tab, { label: string; statuses: RequestStatus[]; hint: string }> = {
  PENDING: { label: "Pending", statuses: ["PENDING"], hint: "Invoices issued under your TRN that the FTA asks you to confirm before the due date." },
  RESPONDED: { label: "Responded", statuses: ["RESPONDED"], hint: "Confirmations you have already submitted. No further action is needed." },
  CLOSED: { label: "Closed", statuses: ["EXPIRED", "CANCELLED"], hint: "Expired: the time limit passed without a response. Cancelled: withdrawn by the FTA, no action needed." },
};

export default function Dashboard() {
  const trn = useTrn();
  const [rows, setRows] = useState<RequestView[] | null>(null);
  const [err, setErr] = useState("");
  const [tab, setTab] = useState<Tab>("PENDING");

  useEffect(() => {
    if (!trn) return;
    listRequests().then(setRows).catch((e) => setErr(e.message));
  }, [trn]);

  const inTab = (t: Tab) => rows?.filter((r) => TABS[t].statuses.includes(r.request.status)) ?? [];
  const count = (t: Tab) => inTab(t).length;
  const shown = inTab(tab);
  const date = (s: string) => s.slice(0, 10);

  return (
    <Shell>
      <h1 className="text-2xl font-semibold tracking-tight">Supplier Dashboard</h1>
      <p className="mt-1 mb-6 text-sm text-muted">VAT refund confirmation requests for invoices issued under your TRN.</p>
      <div className="mb-8 grid grid-cols-3 gap-2 sm:max-w-2xl sm:gap-4">
        {([["PENDING", "Pending confirmations", "text-gold-dark"], ["RESPONDED", "Responded", "text-ink"], ["CLOSED", "Closed", "text-muted"]] as const).map(([t, label, color]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`card p-3 text-start hover:border-gold sm:p-5 ${tab === t ? "border-gold" : ""}`}>
            <div className={`text-2xl font-semibold tabular-nums sm:text-3xl ${color}`}>{count(t)}</div>
            <div className="mt-1 text-xs break-words hyphens-auto text-muted sm:text-sm">{label}</div>
          </button>
        ))}
      </div>
      <section id="requests" className="card overflow-hidden p-0">
        <div className="flex gap-1 overflow-x-auto border-b border-line px-2 sm:px-4">
          {(Object.keys(TABS) as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`-mb-px whitespace-nowrap border-b-2 px-3 py-3 text-sm sm:px-4 ${tab === t ? "border-gold font-semibold text-gold-dark" : "border-transparent text-muted hover:text-ink"}`}>
              {TABS[t].label} <span className="tabular-nums">({count(t)})</span>
            </button>
          ))}
        </div>
        <p className="px-4 py-3 text-sm text-muted">{TABS[tab].hint}</p>
        {err && <p role="alert" className="mx-4 mb-3 rounded-ctl bg-bad-bg p-3 text-sm text-bad">Could not load requests: {err}</p>}
        <div className="overflow-x-auto border-t border-line">
          <table className="tbl">
            <thead>
              <tr>{["Invoice no", "Date", "Applicant", "Plot", "VAT", "Total", "Due", "Status", ""].map((h, n) => <th key={h || n} className={n === 4 || n === 5 ? "text-end" : ""}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {shown.map(({ request: q, invoice: i, application: a }) => (
                <tr key={q.id}>
                  <td className="whitespace-nowrap font-medium">{i.invoice_no}</td>
                  <td className="whitespace-nowrap">{i.invoice_date}</td>
                  <td>{a.applicant_name}</td>
                  <td className="whitespace-nowrap">{a.plot_no}</td>
                  <td className="whitespace-nowrap text-end">{aed(i.vat_amount)}</td>
                  <td className="whitespace-nowrap text-end">{aed(i.total)}</td>
                  <td className="whitespace-nowrap">{date(q.due_at)}</td>
                  <td><StatusPill status={q.status} /></td>
                  <td className="text-end">
                    {q.status === "PENDING"
                      ? <Link className="btn px-3 py-1.5 text-xs" href={`/requests/${q.id}`}>Respond</Link>
                      : <Link className="btn-ghost px-3 py-1 text-xs" href={`/requests/${q.id}`}>View</Link>}
                  </td>
                </tr>
              ))}
              {rows && !shown.length && <tr><td colSpan={9} className="p-8 text-center text-muted">No {TABS[tab].label.toLowerCase()} requests.</td></tr>}
              {!rows && !err && <tr><td colSpan={9} className="p-8 text-center text-muted">Loading…</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </Shell>
  );
}
