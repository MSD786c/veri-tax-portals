"use client";
import { fmtAED, fmtPct, useApi, type Overview } from "@/lib/api";
import { Async, Card, PageTitle, Pill, RatingPill } from "@/components/ui";

export default function OverviewPage() {
  const { data: o, loading, error } = useApi<Overview>("/fta/overview");
  return (
    <>
      <PageTitle>Overview</PageTitle>
      <Async loading={loading} error={error}>
        {o && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              {[
                ["Applications", String(o.applications_total)],
                ["Refunds requested", fmtAED(o.refund_requested_aed)],
                ["Refunds verified", fmtAED(o.refund_verified_aed)],
                ["Rejected refund", fmtAED(o.rejected_refund_aed)],
                ["Supplier response rate", fmtPct(o.supplier_response_rate)],
              ].map(([k, v]) => (
                <div key={k} className="rounded-md border border-slate-200 border-t-4 border-t-gold bg-white p-4 shadow-sm">
                  <div className="text-xs uppercase tracking-wide text-slate-500">{k}</div>
                  <div className="mt-1 text-xl font-semibold text-navy">{v}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              {(["STRONG", "WEAK", "FAIL", "PENDING"] as const).map((r) => (
                <div key={r} className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="text-xs uppercase tracking-wide text-slate-500">Invoices rated <RatingPill rating={r} /></div>
                  <div className="mt-1 text-xl font-semibold text-navy">{o.invoices_by_rating[r] ?? 0}</div>
                </div>
              ))}
              <div className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
                <div className="text-xs uppercase tracking-wide text-slate-500">Officer overrides of agent</div>
                <div className="mt-1 text-xl font-semibold text-navy">{o.officer_overrides}</div>
              </div>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <Card title="Applications by status">
                <ul className="space-y-2">
                  {Object.entries(o.applications_by_status).map(([s, n]) => (
                    <li key={s} className="flex items-center justify-between"><Pill value={s} /><b>{n}</b></li>
                  ))}
                </ul>
              </Card>
              <Card title="Top rule failures">
                {o.top_rule_failures.length === 0 ? <p className="text-slate-500">No failures.</p> : (
                  <ul className="space-y-2">
                    {o.top_rule_failures.map(([r, n]) => (
                      <li key={r} className="flex items-center justify-between"><span className="font-mono">{r}</span><b>{n}</b></li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>
          </div>
        )}
      </Async>
    </>
  );
}
