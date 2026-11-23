"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import Shell, { StatusPill } from "@/components/Shell";
import { aed, listRequests, useTrn, type RequestView } from "@/lib/api";

export default function Dashboard() {
  const trn = useTrn();
  const [rows, setRows] = useState<RequestView[] | null>(null);
  const [err, setErr] = useState("");
  const [tab, setTab] = useState<"PENDING" | "RESPONDED">("PENDING");

  useEffect(() => {
    if (!trn) return;
    listRequests().then(setRows).catch((e) => setErr(e.message));
  }, [trn]);

  const count = (s: string) => rows?.filter((r) => r.request.status === s).length ?? 0;
  const shown = rows?.filter((r) => r.request.status === tab) ?? [];
  const date = (s: string) => s.slice(0, 10);

  return (
    <Shell>
      <h1 className="mb-4 text-xl font-semibold">Supplier Dashboard</h1>
      <div className="mb-6 grid grid-cols-2 gap-4 sm:max-w-md">
        <div className="card"><div className="text-3xl font-bold text-gold">{count("PENDING")}</div><div className="text-sm text-muted">Pending confirmations</div></div>
        <div className="card"><div className="text-3xl font-bold">{count("RESPONDED")}</div><div className="text-sm text-muted">Responded</div></div>
      </div>
      <section id="requests" className="card overflow-x-auto p-0">
        <div className="flex gap-1 border-b border-line px-3 pt-3">
          {(["PENDING", "RESPONDED"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`rounded-t px-4 py-2 text-sm ${tab === t ? "border-b-2 border-gold font-semibold text-gold-dark" : "text-muted"}`}>
              {t === "PENDING" ? "Pending" : "Responded"} ({count(t)})
            </button>
          ))}
        </div>
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
                <td className="px-3 py-2"><StatusPill status={tab === "RESPONDED" ? i.status : q.status} /></td>
                <td className="px-3 py-2"><Link className="font-semibold text-gold-dark underline" href={`/requests/${q.id}`}>{q.status === "PENDING" ? "Respond" : "View"}</Link></td>
              </tr>
            ))}
            {rows && !shown.length && <tr><td colSpan={9} className="p-6 text-center text-muted">No {tab.toLowerCase()} requests.</td></tr>}
            {!rows && !err && <tr><td colSpan={9} className="p-6 text-center text-muted">Loading…</td></tr>}
          </tbody>
        </table>
      </section>
    </Shell>
  );
}
