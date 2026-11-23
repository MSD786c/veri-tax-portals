"use client";
import Link from "next/link";
import { fmtAED, useApi, type RejectionRow } from "@/lib/api";
import { Async, Card, PageTitle, Pill, Table, Td, Th } from "@/components/ui";

export default function Rejections() {
  const { data, loading, error } = useApi<RejectionRow[]>("/fta/rejections");
  return (
    <>
      <PageTitle>Rejections</PageTitle>
      <Card title="Rejected, flagged and disputed invoices">
        <Async loading={loading} error={error}>
          <Table>
            <thead><tr><Th>Invoice</Th><Th>Supplier</Th><Th>Application</Th><Th>Status</Th><Th right>VAT</Th><Th>Failed rules</Th></tr></thead>
            <tbody>
              {data?.map((r) => (
                <tr key={r.invoice.id}>
                  <Td>{r.invoice.invoice_no}</Td>
                  <Td><Link className="text-sky-800 hover:underline" href={`/suppliers/${r.invoice.supplier_trn}`}>{r.supplier_name}</Link></Td>
                  <Td><Link className="text-sky-800 hover:underline" href={`/applications/${r.invoice.application_id}`}>#{r.invoice.application_id}</Link></Td>
                  <Td><Pill value={r.invoice.status} /></Td><Td right>{fmtAED(r.invoice.vat_amount)}</Td>
                  <Td mono>{r.failed_rules.join(", ") || "-"}</Td>
                </tr>
              ))}
              {data?.length === 0 && <tr><Td>Nothing rejected.</Td></tr>}
            </tbody>
          </Table>
        </Async>
      </Card>
    </>
  );
}
