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
      <h1 className="mb-4 text-xl font-semibold">Supplier Dashboard</h1>
      <div className="mb-6 grid grid-cols-3 gap-2 sm:max-w-xl sm:gap-4">
        <div className="card p-3 sm:p-5"><div className="text-2xl font-bold sm:text-3xl text-gold">{count("PENDING")}</div><div className="text-xs text-muted hyphens-auto break-words sm:text-sm">Pending confirmations</div></div>
        <div className="card p-3 sm:p-5"><div className="text-2xl font-bold sm:text-3xl">{count("RESPONDED")}</div><div className="text-xs text-muted hyphens-auto break-words sm:text-sm">Responded</div></div>
        <div className="card p-3 sm:p-5"><div className="text-2xl font-bold sm:text-3xl text-muted">{count("CLOSED")}</div><div className="text-xs text-muted hyphens-auto break-words sm:text-sm">Closed</div></div>
      </div>
      <section id="requests" className="card overflow-x-auto p-0">
        <div className="flex gap-1 border-b border-line px-3 pt-3">
          {(Object.keys(TABS) as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`rounded-t px-4 py-2 text-sm ${tab === t ? "border-b-2 border-gold font-semibold text-gold-dark" : "text-muted"}`}>
              {TABS[t].label} ({count(t)})
            </button>
          ))}
        </div>
        <p className="px-4 pt-3 text-sm text-muted">{TABS[tab].hint}</p>
        {err && <p className="p-4 text-sm text-red-700">Could not load requests: {err}</p>}
        <table className="w-full text-sm">
          <thead className="bg-page text-start text-xs uppercase text-muted">
            <tr>{["Invoice no", "Date", "Applicant", "Plot", "VAT", "Total", "Due", "Status", ""].map((h) => <th key={h} className="px-3 py-2 text-start font-medium">{h}</th>)}</tr>
          </thead>
          <tbody>
            {shown.map(({ request: q, invoice: i, application: a }) => (
              <tr key={q.id} className="border-t border-line">
                <td className="px-3 py-2 font-medium">{i.invoice_no}</td>
                <td className="px-3 py-2">{i.invoice_date}</td>
                <td className="px-3 py-2">{a.applicant_name}</td>
                <td className="px-3 py-2">{a.plot_no}</td>
                <td className="px-3 py-2">{aed(i.vat_amount)}</td>
                <td className="px-3 py-2">{aed(i.total)}</td>
                <td className="px-3 py-2">{date(q.due_at)}</td>
                <td className="px-3 py-2"><StatusPill status={q.status} /></td>
                <td className="px-3 py-2"><Link className="font-semibold text-gold-dark underline" href={`/requests/${q.id}`}>{q.status === "PENDING" ? "Respond" : "View"}</Link></td>
              </tr>
            ))}
            {rows && !shown.length && <tr><td colSpan={9} className="p-6 text-center text-muted">No {TABS[tab].label.toLowerCase()} requests.</td></tr>}
            {!rows && !err && <tr><td colSpan={9} className="p-6 text-center text-muted">Loading…</td></tr>}
          </tbody>
        </table>
      </section>
    </Shell>
  );
}
