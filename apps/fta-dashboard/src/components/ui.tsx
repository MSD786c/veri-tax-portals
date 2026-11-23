import type { ReactNode } from "react";

const TONE: Record<string, string> = {
  green: "bg-emerald-100 text-emerald-800",
  red: "bg-red-100 text-red-800",
  amber: "bg-amber-100 text-amber-800",
  blue: "bg-sky-100 text-sky-800",
  grey: "bg-slate-200 text-slate-700",
};
const STATUS_TONE: Record<string, string> = {
  PASS: "green", VERIFIED: "green", AUTO_VERIFIED: "green", SUPPLIER_CONFIRMED: "green", RECONCILED: "green", APPROVED: "green", RESPONDED: "green",
  FAIL: "red", REJECTED: "red", AUTO_REJECTED: "red", DISPUTED: "red",
  UNCERTAIN: "amber", EXPIRED: "amber", CANCELLED: "grey", NOT_APPLICABLE: "grey", EXTRACTED: "green", FAILED: "red", UPLOADED: "blue", FLAGGED: "amber", PARTIALLY_APPROVED: "amber", NO_SUPPLIER_RESPONSE: "amber", PENDING: "amber",
  READY_FOR_DECISION: "blue", AWAITING_SUPPLIERS: "blue", AWAITING_SUPPLIER: "blue", NEEDS_SUPPLIER: "blue", IN_VERIFICATION: "blue",
};

export function Pill({ value, tone }: { value: string; tone?: string }) {
  const t = TONE[tone ?? STATUS_TONE[value] ?? "grey"];
  return <span className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ${t}`}>{value.replaceAll("_", " ")}</span>;
}

const RATING_TONE: Record<string, string> = { STRONG: "green", WEAK: "amber", FAIL: "red" };
export const RatingPill = ({ rating }: { rating: string | null | undefined }) =>
  rating && rating !== "PENDING" ? <Pill value={rating} tone={RATING_TONE[rating]} /> : <Pill value="Pending" tone="grey" />;

// Compact per-rating counts, e.g. for an application row. Order: STRONG, WEAK, FAIL, PENDING.
export function RatingCounts({ counts }: { counts: Partial<Record<string, number>> }) {
  const keys = ["STRONG", "WEAK", "FAIL", "PENDING"].filter((k) => counts[k]);
  if (!keys.length) return <>-</>;
  return (
    <span className="inline-flex flex-wrap gap-1">
      {keys.map((k) => <span key={k} className="inline-flex items-center gap-0.5"><RatingPill rating={k} /><b className="text-xs">{counts[k]}</b></span>)}
    </span>
  );
}

export function Card({ title, children, right }: { title?: string; children: ReactNode; right?: ReactNode }) {
  return (
    <section className="rounded-md border border-slate-200 bg-white shadow-sm">
      {title && (
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-2.5">
          <h2 className="text-sm font-semibold text-navy">{title}</h2>
          {right}
        </header>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

export const Table = ({ children }: { children: ReactNode }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-left text-[13px]">{children}</table>
  </div>
);
export const Th = ({ children, right }: { children?: ReactNode; right?: boolean }) => (
  <th className={`border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 ${right ? "text-right" : ""}`}>{children}</th>
);
export const Td = ({ children, right, mono }: { children?: ReactNode; right?: boolean; mono?: boolean }) => (
  <td className={`border-b border-slate-100 px-3 py-2 ${right ? "text-right tabular-nums" : ""} ${mono ? "font-mono text-xs" : ""}`}>{children}</td>
);

export const PageTitle = ({ children }: { children: ReactNode }) => <h1 className="mb-4 text-xl font-semibold text-navy">{children}</h1>;

export function Async({ loading, error, children }: { loading: boolean; error?: string; children: ReactNode }) {
  if (error) return <p className="rounded border border-red-200 bg-red-50 p-3 text-red-800">Error: {error}</p>;
  if (loading) return <p className="text-slate-500">Loading…</p>;
  return <>{children}</>;
}

export const inputCls = "rounded border border-slate-300 bg-white px-2.5 py-1.5 text-sm focus:border-gold focus:outline-none";
export const btnCls = "rounded bg-gold px-3.5 py-1.5 text-sm font-semibold text-white hover:bg-[#9c7529] disabled:opacity-50";
