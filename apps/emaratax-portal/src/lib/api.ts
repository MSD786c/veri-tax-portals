import { useSyncExternalStore } from "react";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
export const TEST_SUPPLIERS = [
  { trn: "100111111100003", name: "Al Noor Building Contracting" },
  { trn: "100222222200003", name: "Gulf Steel & Cement" },
  { trn: "100333333300003", name: "Desert Rose Electrical" },
  { trn: "100444444400003", name: "Emirates Home Furnishing" },
];

export type RequestStatus = "PENDING" | "RESPONDED" | "EXPIRED";
export type Supplier = { trn: string; legal_name: string; emirate: string; address: string };
export type Invoice = {
  id: number; invoice_no: string; invoice_date: string; title: string; description: string;
  taxable_amount: number; vat_amount: number; total: number; currency: string;
  plot_no: string; supplier_trn: string;
  status: string; // VERIFIED | FLAGGED | DISPUTED | AWAITING_SUPPLIER | ...
};
export type SupplierResponse = {
  issued: boolean; particulars_confirmed: boolean; corrections: Record<string, unknown>;
  consideration_status: "RECEIVED" | "PARTIAL_OR_RETENTION" | null;
  amount_received: number | null; received_date: string | null;
  retention_amount: number | null; retention_release_date: string | null;
  vat_return_period: string | null; declared_by: string; declared_at: string;
};
export type RequestView = {
  request: { id: number; invoice_id: number; status: RequestStatus; sent_at: string; due_at: string };
  invoice: Invoice;
  application: { maskan_ref: string; applicant_name: string; plot_no: string; emirate: string };
  response: SupplierResponse | null;
};
export type RespondBody = {
  issued: boolean; particulars_confirmed: boolean; corrections: Record<string, string | number>;
  consideration_status?: "RECEIVED" | "PARTIAL_OR_RETENTION";
  amount_received?: number; received_date?: string; retention_amount?: number;
  retention_release_date?: string; vat_return_period?: string;
  declared_by: string; declaration: boolean;
};

// Mock session: the TRN lives in localStorage. ponytail: replace with UAE PASS / EmaraTax token.
const KEY = "emx_trn";
const listeners = new Set<() => void>();
export const getTrn = () => { try { return localStorage.getItem(KEY); } catch { return null; } };
export function setTrn(trn: string | null) {
  try { if (trn) localStorage.setItem(KEY, trn); else localStorage.removeItem(KEY); } catch {}
  listeners.forEach((l) => l());
}
export const useTrn = () =>
  useSyncExternalStore((cb) => { listeners.add(cb); return () => listeners.delete(cb); }, getTrn, () => undefined);

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const trn = getTrn();
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(trn ? { "X-Supplier-TRN": trn } : {}) },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const d = body?.detail;
    throw new ApiError(res.status, typeof d === "string" ? d : d ? JSON.stringify(d) : res.statusText);
  }
  return res.json();
}

export const getMe = () => call<Supplier>("/supplier/me");
export const listRequests = (status?: RequestStatus) =>
  call<RequestView[]>(`/supplier/requests${status ? `?status=${status}` : ""}`);
export const getRequest = (id: string | number) => call<RequestView>(`/supplier/requests/${id}`);
export const respond = (id: number, body: RespondBody) =>
  call<RequestView>(`/supplier/requests/${id}/respond`, { method: "POST", body: JSON.stringify(body) });

export const aed = (n: number | null | undefined) =>
  n == null ? "-" : n.toLocaleString("en-AE", { style: "currency", currency: "AED" });
