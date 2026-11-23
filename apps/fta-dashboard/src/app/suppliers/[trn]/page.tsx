"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { fmtAED, fmtPct, useApi, type SupplierDetail } from "@/lib/api";
import { Async, Card, PageTitle, Pill, RatingPill, Table, Td, Th } from "@/components/ui";

export default function SupplierPage() {
  const { trn } = useParams<{ trn: string }>();
  const { data: s, loading, error } = useApi<SupplierDetail>(`/fta/suppliers/${trn}`);
  return (
    <>
      <PageTitle>{s?.legal_name ?? "Supplier"}</PageTitle>
      <Async loading={loading} error={error}>
        {s && (
          <div className="space-y-4">
            <Card title="Profile" right={s.risk_flag ? <Pill value="RISK" tone="red" /> : <Pill value="OK" tone="green" />}>
              <div className="grid gap-1 text-[13px] sm:grid-cols-2 lg:grid-cols-3">
                <div>TRN: <span className="font-mono">{s.trn}</span></div>
                <div>Emirate: {s.emirate}</div>
                <div>Applications: {s.application_count}</div>
                <div>Invoices: {s.invoice_count}</div>
                <div>VAT claimed: {fmtAED(s.vat_claimed)}</div>
                <div>VAT verified: {fmtAED(s.vat_verified)}</div>
                <div>VAT rejected: {fmtAED(s.vat_rejected)}</div>
                <div>Response rate: {fmtPct(s.response_rate)}</div>
                <div>Retention outstanding: {fmtAED(s.retention_outstanding)}</div>
                <div className="sm:col-span-2">Declared VAT periods: {s.declared_vat_periods.join(", ") || "-"}</div>
              </div>
            </Card>
            <Card title="Invoices">
              <Table>
                <thead><tr><Th>Invoice</Th><Th>Date</Th><Th>Application</Th><Th>Status</Th><Th>Rating</Th><Th right>VAT</Th><Th right>Eligible</Th></tr></thead>
                <tbody>
                  {s.invoices.map((i) => (
                    <tr key={i.id}>
                      <Td>{i.invoice_no}</Td><Td>{i.invoice_date}</Td>
                      <Td><Link className="text-sky-800 hover:underline" href={`/applications/${i.application_id}`}>#{i.application_id}</Link></Td>
                      <Td><Pill value={i.status} /></Td><Td><RatingPill rating={i.rating} /></Td><Td right>{fmtAED(i.vat_amount)}</Td><Td right>{fmtAED(i.eligible_vat_amount)}</Td>
                    </tr>
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
