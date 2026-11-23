"use client";
import Link from "next/link";
import { useState } from "react";
import { fmtAED, fmtPct, useApi, type SupplierRow } from "@/lib/api";
import { Async, Card, PageTitle, Pill, Table, Td, Th, inputCls } from "@/components/ui";

export default function Suppliers() {
  const [q, setQ] = useState("");
  const { data, loading, error } = useApi<SupplierRow[]>(`/fta/suppliers${q ? "?q=" + encodeURIComponent(q) : ""}`);
  return (
    <>
      <PageTitle>Suppliers</PageTitle>
      <Card title="Suppliers">
        <input className={`${inputCls} mb-3 w-full sm:w-72`} placeholder="Search name or TRN" value={q} onChange={(e) => setQ(e.target.value)} />
        <Async loading={loading} error={error}>
          <Table>
            <thead><tr><Th>Supplier</Th><Th>TRN</Th><Th right>Apps</Th><Th right>Invoices</Th><Th right>VAT claimed</Th><Th right>Verified</Th><Th right>Rejected</Th><Th right>Response rate</Th><Th>Risk</Th></tr></thead>
            <tbody>
              {data?.map((s) => (
                <tr key={s.trn} className="hover:bg-slate-50">
                  <Td><Link className="font-medium text-sky-800 hover:underline" href={`/suppliers/${s.trn}`}>{s.legal_name}</Link></Td>
                  <Td mono>{s.trn}</Td><Td right>{s.application_count}</Td><Td right>{s.invoice_count}</Td>
                  <Td right>{fmtAED(s.vat_claimed)}</Td><Td right>{fmtAED(s.vat_verified)}</Td><Td right>{fmtAED(s.vat_rejected)}</Td>
                  <Td right>{fmtPct(s.response_rate)}</Td>
                  <Td>{s.risk_flag ? <Pill value="RISK" tone="red" /> : <Pill value="OK" tone="green" />}</Td>
                </tr>
              ))}
              {data?.length === 0 && <tr><Td>No suppliers.</Td></tr>}
            </tbody>
          </Table>
        </Async>
      </Card>
    </>
  );
}
