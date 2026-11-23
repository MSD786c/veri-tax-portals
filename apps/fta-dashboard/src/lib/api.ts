// Thin API client for the veri-tax FTA endpoints. Auth is mocked via X-Officer-Id.
import { useCallback, useEffect, useState } from "react";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const KEY = "fta_officer_id";

export const getOfficer = () => (typeof window === "undefined" ? null : localStorage.getItem(KEY));
// dispatch "storage" so Shell (useSyncExternalStore) sees same-tab changes
export const setOfficer = (id: string) => { localStorage.setItem(KEY, id); window.dispatchEvent(new Event("storage")); };
export const clearOfficer = () => { localStorage.removeItem(KEY); window.dispatchEvent(new Event("storage")); };

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(API_URL + path, {
    ...init,
    headers: { "Content-Type": "application/json", "X-Officer-Id": getOfficer() ?? "", ...init.headers },
  });
  if (!res.ok) throw await httpError(res);
  return res.json();
}

// FastAPI errors: detail is a string, or (422) a list of {loc, msg}.
async function httpError(res: Response) {
  const d = (await res.json().catch(() => null))?.detail;
  const msg = typeof d === "string" ? d
    : Array.isArray(d) ? d.map((x) => (x?.loc ? `${x.loc.at(-1)}: ${x.msg}` : x?.msg ?? JSON.stringify(x))).join("; ")
    : "";
  return new Error(msg || `HTTP ${res.status}`);
}

// Fetches `path` (null = skip). Returns data/error/loading and a reload().
export function useApi<T>(path: string | null) {
  const [state, setState] = useState<{ key: string; data?: T; error?: string }>({ key: "" });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!path) return;
    let live = true;
    api<T>(path)
      .then((data) => live && setState({ key: path + tick, data }))
      .catch((e: Error) => live && setState({ key: path + tick, error: e.message }));
    return () => {
      live = false;
    };
  }, [path, tick]);
  const loading = !!path && state.key !== path + tick;
  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { data: loading ? undefined : state.data, error: loading ? undefined : state.error, loading, reload };
}

const aed = new Intl.NumberFormat("en-AE", { style: "currency", currency: "AED" });
export const fmtAED = (n: number | null | undefined) => (n == null ? "-" : aed.format(n));
export const fmtPct = (n: number | null | undefined) => (n == null ? "-" : `${Math.round(n * 100)}%`);
export const fmtDate = (s: string | null | undefined) => (s ? s.slice(0, 16).replace("T", " ") : "-");

export type Application = {
  id: number;
  flags: string[]; // application-level warnings (CS-01)
  contract_value?: number;
  maskan_ref: string;
  applicant_name: string;
  plot_no: string;
  completion_date: string;
  status: string;
  emirate: string;
  claim_type: string;
  submitted_at: string;
};
export type RatingCounts = Partial<Record<"STRONG" | "WEAK" | "FAIL" | "PENDING", number>>;
export type ApplicationRow = Application & { invoice_count: number; invoices_by_rating: RatingCounts; vat_claimed: number; vat_eligible: number };
export type Supplier = {
  trn: string;
  legal_name: string;
  emirate: string;
  address: string;
  risk_flag: boolean;
  emaratax_account_id: string | null;
};
export type SupplierRow = Supplier & {
  application_count: number;
  invoice_count: number;
  vat_claimed: number;
  vat_verified: number;
  vat_rejected: number;
  response_rate: number | null;
};
export type Invoice = {
  id: number;
  invoice_no: string;
  title: string;
  vat_amount: number;
  currency: string;
  description: string;
  eligible_vat_amount: number;
  application_id: number;
  invoice_date: string;
  supplier_trn: string;
  taxable_amount: number;
  total: number;
  plot_no: string;
  status: string;
  rating: Rating | null; // null = pending (supplier step still open)
  rating_reasons: string[];
  fix_guidance: string[];
  suggested_eligible_vat: number | null;
  officer_decision: "APPROVED" | "REJECTED" | null;
  invoice_type: string | null;
  supplier_address: string;
  recipient_name: string;
  recipient_address: string;
  line_items: { description: string; quantity: number; unit_price: number; amount: number }[];
};
export type Rating = "STRONG" | "WEAK" | "FAIL";
export type RuleResult = { id: number; rule_id: string; result: "PASS" | "FAIL" | "UNCERTAIN" | "NOT_APPLICABLE"; rule_version: string; evidence: Record<string, unknown> };
export type SupplierResponse = {
  issued: boolean;
  particulars_confirmed: boolean;
  corrections: Record<string, unknown>;
  consideration_status: string | null;
  amount_received: number | null;
  retention_amount: number | null;
  vat_return_period: string | null;
  declared_by: string;
  declared_at: string;
};
export type RequestStatus = "PENDING" | "RESPONDED" | "EXPIRED" | "CANCELLED";
export type InvoiceDecision = {
  id: number;
  invoice_id: number;
  officer_id: string;
  decision: "APPROVED" | "REJECTED";
  approved_vat_amount: number;
  comment: string;
  agent_rating: Rating | null;
  overrode_agent: boolean;
  signature: string;
  decided_at: string;
};
export type DocumentMeta = {
  id: number;
  filename: string;
  content_type: string;
  source: string; // maskan-portal | maskan
  status: string;
  label: string | null;
  error: string | null;
  size: number;
  sha256: string;
  uploaded_at: string;
};
export type Extraction = {
  document_type: string;
  fields: Record<string, { value: unknown; confidence: number }>;
  model: string;
  prompt_version: string;
};
export type AgentRun = {
  id: number;
  kind: "compliance" | "reconciliation" | string;
  entity: string;
  model: string;
  prompt_version: string;
  error: string | null;
  at: string;
  output: {
    // compliance
    recommendations?: { rule_id: string; recommendation: string; reason: string }[];
    eligible_goods?: boolean;
    notes?: string;
    // reconciliation
    recommended_decision?: string;
    recommended_amount?: number;
    summary?: string;
    reasons?: string[];
    risks?: string[];
    follow_up?: string[];
  } | null;
};
export type InvoiceBundle = {
  invoice: Invoice;
  supplier: Supplier | null;
  rule_results: RuleResult[];
  confirmation_request: { status: RequestStatus; due_at: string; sent_at: string; reminders: number } | null;
  supplier_response: SupplierResponse | null;
  supplier_trust: { tier: string; confirmed: number; disputed: number; corrected: number; no_response: number } | null;
  precedents: InvoiceDecision[];
  officer_decision: InvoiceDecision | null;
  document: DocumentMeta | null;
  extraction: Extraction | null;
  agent_runs: AgentRun[];
};
export type DocumentRow = {
  document: DocumentMeta;
  extraction: Extraction | null;
  linked_invoices: { invoice_id: number; invoice_no: string; status: string; maskan_ref: string; application_id?: number }[];
};

// Rule results append over time: keep the last result per rule_id, in first-seen order.
export const latestRules = (rr: RuleResult[]) => [...new Map(rr.map((r) => [r.rule_id, r])).values()];

// The file endpoint needs the officer header, so fetch it and open an object URL.
export async function openDocument(id: number) {
  const tab = window.open("", "_blank"); // open synchronously so popup blockers allow it
  const res = await fetch(`${API_URL}/fta/documents/${id}/file`, { headers: { "X-Officer-Id": getOfficer() ?? "" } });
  if (!res.ok) {
    tab?.close();
    throw await httpError(res);
  }
  const url = URL.createObjectURL(await res.blob());
  if (tab) tab.location.href = url;
  else window.location.href = url;
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
export type Decision = { officer_id: string; decision: string; approved_amount: number; comments: string; decided_at: string };
export type AuditEvent = { id: number; actor: string; action: string; entity: string; detail: Record<string, unknown>; at: string };
export type ApplicationDetail = { application: Application; invoices: InvoiceBundle[]; decision: Decision | null; audit: AuditEvent[]; agent_runs: AgentRun[] };
export type Overview = {
  applications_total: number;
  applications_by_status: Record<string, number>;
  refund_requested_aed: number;
  refund_verified_aed: number;
  rejected_applications: number;
  rejected_refund_aed: number;
  supplier_response_rate: number | null;
  invoices_by_rating: RatingCounts;
  officer_overrides: number;
  top_rule_failures: [string, number][];
};
export type SupplierDetail = SupplierRow & { invoices: Invoice[]; declared_vat_periods: string[]; retention_outstanding: number };
export type RejectionRow = { invoice: Invoice; supplier_name: string; failed_rules: string[] };
