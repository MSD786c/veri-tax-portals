"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api, fmtAED, fmtDate, useApi, type ApplicationDetail, type ApplicationRow, type DocumentRow, type Rating } from "@/lib/api";
import { Async, Card, PageTitle, Pill, RatingPill, Table, Td, Th } from "@/components/ui";
import { OpenDocButton } from "@/components/OpenDocButton";

const v = (r: DocumentRow, k: string) => r.extraction?.fields[k]?.value;

export default function Documents() {
  const { data, loading, error } = useApi<DocumentRow[]>("/fta/documents");
  // linked_invoices carry maskan_ref, not the application id: map it from the applications list.
  const { data: apps } = useApi<ApplicationRow[]>("/fta/applications");
  const appId = new Map(apps?.map((a) => [a.maskan_ref, a.id]));
  // linked_invoices carry no rating either: read it from each linked application's detail.
  // ponytail: one GET per linked application; ask the backend to add rating to linked_invoices if this grows.
  const linkedApps = [...new Set(data?.flatMap((r) => r.linked_invoices.map((l) => l.application_id ?? appId.get(l.maskan_ref))).filter((x) => x != null))].join(",");
  const [ratings, setRatings] = useState<Record<number, Rating | null>>({});
  useEffect(() => {
    if (!linkedApps) return;
    let live = true;
    Promise.all(linkedApps.split(",").map((id) => api<ApplicationDetail>(`/fta/applications/${id}`).catch(() => null))).then((ds) => {
      if (live) setRatings(Object.fromEntries(ds.flatMap((d) => d?.invoices.map((b) => [b.invoice.id, b.invoice.rating]) ?? [])));
    });
    return () => {
      live = false;
    };
  }, [linkedApps]);
  return (
    <>
      <PageTitle>Documents</PageTitle>
      <Card title="Original invoice documents">
        <Async loading={loading} error={error}>
          <Table>
            <thead>
              <tr><Th>File</Th><Th>Source</Th><Th>Status</Th><Th>Type</Th><Th>Supplier / TRN</Th><Th>Invoice no.</Th><Th right>Total</Th><Th>Linked invoices</Th><Th /></tr>
            </thead>
            <tbody>
              {data?.map((r) => {
                const total = v(r, "total");
                return (
                  <tr key={r.document.id} className="hover:bg-slate-50">
                    <Td><span className="font-mono text-xs">{r.document.filename}</span><div className="text-xs text-slate-500">{fmtDate(r.document.uploaded_at)}</div></Td>
                    <Td>{r.document.source}</Td>
                    <Td><Pill value={r.document.status} />{r.document.error && <div className="text-xs text-red-700">{r.document.error}</div>}</Td>
                    <Td>{r.extraction ? <Pill value={r.extraction.document_type} tone={r.extraction.document_type === "TAX_INVOICE" ? "blue" : "amber"} /> : "-"}</Td>
                    <Td>{String(v(r, "supplier_name") ?? "-")}<div className="font-mono text-xs text-slate-500">{String(v(r, "supplier_trn") ?? "-")}</div></Td>
                    <Td mono>{String(v(r, "invoice_no") ?? "-")}</Td>
                    <Td right>{typeof total === "number" ? fmtAED(total) : "-"}</Td>
                    <Td>
                      {r.linked_invoices.length === 0 ? <span className="text-slate-500">Not linked</span> : r.linked_invoices.map((l) => {
                        const id = l.application_id ?? appId.get(l.maskan_ref);
                        const label = `${l.invoice_no} · ${l.maskan_ref}`;
                        return (
                          <div key={l.invoice_id}>
                            {id ? <Link className="whitespace-nowrap text-sky-800 hover:underline" href={`/applications/${id}`}>{label}</Link> : label}<div className="flex flex-wrap gap-1">{l.invoice_id in ratings && <RatingPill rating={ratings[l.invoice_id]} />}<Pill value={l.status} /></div>
                          </div>
                        );
                      })}
                    </Td>
                    <Td><OpenDocButton id={r.document.id} /></Td>
                  </tr>
                );
              })}
              {data?.length === 0 && <tr><Td>No documents.</Td></tr>}
            </tbody>
          </Table>
        </Async>
      </Card>
    </>
  );
}
