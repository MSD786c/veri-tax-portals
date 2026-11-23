"use client";
import Link from "next/link";
import { useState } from "react";
import { API_URL, fmtAED, getOfficer, useApi, type ApplicationRow } from "@/lib/api";
import { Async, Card, PageTitle, Pill, RatingCounts, Table, Td, Th, btnCls, inputCls } from "@/components/ui";

const STATUSES = ["RECEIVED", "IN_VERIFICATION", "AWAITING_SUPPLIERS", "READY_FOR_DECISION", "APPROVED", "PARTIALLY_APPROVED", "REJECTED"];
const EMIRATES = ["Abu Dhabi", "Dubai", "Sharjah", "Ajman", "Umm Al Quwain", "Ras Al Khaimah", "Fujairah"];

export default function Applications() {
  const [status, setStatus] = useState("");
  const [emirate, setEmirate] = useState("");
  const qs = new URLSearchParams({ ...(status && { status }), ...(emirate && { emirate }) }).toString();
  const { data, loading, error } = useApi<ApplicationRow[]>(`/fta/applications${qs && "?" + qs}`);

  // The CSV endpoint needs the officer header, so a plain <a href> won't work: fetch + blob.
  const exportCsv = async () => {
    const res = await fetch(`${API_URL}/fta/export/applications.csv`, { headers: { "X-Officer-Id": getOfficer() ?? "" } });
    const url = URL.createObjectURL(await res.blob());
    Object.assign(document.createElement("a"), { href: url, download: "applications.csv" }).click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <PageTitle>Applications</PageTitle>
      <Card
        right={<button className={btnCls} onClick={exportCsv}>Export CSV</button>}
        title="Refund applications"
      >
        <div className="mb-3 flex flex-wrap gap-2">
          <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s.replaceAll("_", " ")}</option>)}
          </select>
          <select className={inputCls} value={emirate} onChange={(e) => setEmirate(e.target.value)} aria-label="Emirate">
            <option value="">All emirates</option>
            {EMIRATES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <Async loading={loading} error={error}>
          <Table>
            <thead><tr><Th>Ref</Th><Th>Applicant</Th><Th>Emirate</Th><Th>Plot</Th><Th>Status</Th><Th right>Invoices</Th><Th>Ratings</Th><Th right>VAT claimed</Th><Th right>VAT eligible</Th></tr></thead>
            <tbody>
              {data?.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <Td><Link className="font-medium text-sky-800 hover:underline" href={`/applications/${a.id}`}>{a.maskan_ref}</Link></Td>
                  <Td>{a.applicant_name}</Td><Td>{a.emirate}</Td><Td mono>{a.plot_no}</Td>
                  <Td><Pill value={a.status} />{a.flags?.length > 0 && <span title={a.flags.join("\n")}> <Pill value="FLAG" tone="amber" /></span>}</Td>
                  <Td right>{a.invoice_count}</Td><Td><RatingCounts counts={a.invoices_by_rating} /></Td><Td right>{fmtAED(a.vat_claimed)}</Td><Td right>{fmtAED(a.vat_eligible)}</Td>
                </tr>
              ))}
              {data?.length === 0 && <tr><Td>No applications.</Td></tr>}
            </tbody>
          </Table>
        </Async>
      </Card>
    </>
  );
}
