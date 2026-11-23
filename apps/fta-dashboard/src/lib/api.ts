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
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(typeof body?.detail === "string" ? body.detail : `HTTP ${res.status}`);
  }
  return res.json();
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
  maskan_ref: string;
  applicant_name: string;
  plot_no: string;
  completion_date: string;
  status: string;
  emirate: string;
  claim_type: string;
  submitted_at: string;
};
export type ApplicationRow = Application & { invoice_count: number; vat_claimed: number; vat_eligible: number };
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
};
export type RuleResult = { id: number; rule_id: string; result: "PASS" | "FAIL" | "UNCERTAIN"; rule_version: string; evidence: Record<string, unknown> };
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
export type InvoiceBundle = {
  invoice: Invoice;
  supplier: Supplier | null;
  rule_results: RuleResult[];
  confirmation_request: { status: string; due_at: string; sent_at: string; reminders: number } | null;
  supplier_response: SupplierResponse | null;
};
export type Decision = { officer_id: string; decision: string; approved_amount: number; comments: string; decided_at: string };
export type AuditEvent = { id: number; actor: string; action: string; entity: string; detail: Record<string, unknown>; at: string };
export type ApplicationDetail = { application: Application; invoices: InvoiceBundle[]; decision: Decision | null; audit: AuditEvent[] };
export type Overview = {
  applications_total: number;
  applications_by_status: Record<string, number>;
  refund_requested_aed: number;
  refund_verified_aed: number;
  rejected_applications: number;
  rejected_refund_aed: number;
  supplier_response_rate: number | null;
  top_rule_failures: [string, number][];
};
export type SupplierDetail = SupplierRow & { invoices: Invoice[]; declared_vat_periods: string[]; retention_outstanding: number };
export type RejectionRow = { invoice: Invoice; supplier_name: string; failed_rules: string[] };
