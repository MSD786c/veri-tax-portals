"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getMe, setTrn, useTrn, type Supplier } from "@/lib/api";

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/#requests", label: "VAT Refund Confirmations" },
  { href: "#", label: "Profile" },
];

const TONE: Record<string, string> = {
  PENDING: "warn", AWAITING_SUPPLIER: "warn", FLAGGED: "warn", NO_SUPPLIER_RESPONSE: "warn",
  RESPONDED: "info", VERIFIED: "ok",
  DISPUTED: "bad", REJECTED: "bad", AUTO_REJECTED: "bad",
};

export function StatusPill({ status }: { status: string }) {
  return <span className={`pill pill-${TONE[status] ?? "neutral"}`}>{status.replace(/_/g, " ")}</span>;
}

// Government chrome shared by the login page and the signed-in shell.
export function GovHeader({ children }: { children?: React.ReactNode }) {
  return (
    <>
      <div className="bg-navy px-4 text-xs leading-8 text-white sm:px-6">United Arab Emirates · Federal Tax Authority</div>
      <header className="flex flex-wrap items-center justify-between gap-3 border-b-[3px] border-gold bg-surface px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <span aria-hidden className="grid size-9 place-items-center rounded-ctl bg-gold text-sm font-bold text-white">E</span>
          <span>
            <span className="block text-xl font-bold leading-tight tracking-tight text-gold">EmaraTax</span>
            <span className="block text-xs text-muted">Federal Tax Authority e-Services</span>
          </span>
        </Link>
        {children}
      </header>
    </>
  );
}

export function GovFooter() {
  return (
    <footer className="border-t border-line bg-surface px-4 py-4 text-center text-xs text-muted sm:px-6">
      Hackathon prototype – not an official government service. Synthetic data only.
    </footer>
  );
}

export default function Shell({ children }: { children: React.ReactNode }) {
  const trn = useTrn();
  const router = useRouter();
  const path = usePathname();
  const [me, setMe] = useState<Supplier | null>(null);

  useEffect(() => {
    if (trn === null) router.replace("/login");
    else if (trn) getMe().then(setMe).catch(() => setTrn(null));
  }, [trn, router]);

  const active = (label: string) =>
    (label === "Dashboard" && path === "/") || (label === "VAT Refund Confirmations" && path.startsWith("/requests"));

  if (!trn) return null;
  return (
    <div className="flex min-h-screen flex-col">
      <GovHeader>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-end leading-tight">
            <span className="block font-medium">{me?.legal_name}</span>
            <span className="block text-xs tabular-nums text-muted">TRN {trn}</span>
          </span>
          <button className="btn-ghost" onClick={() => { setTrn(null); router.replace("/login"); }}>Log out</button>
        </div>
      </GovHeader>
      <div className="flex flex-1 flex-col md:flex-row">
        <nav aria-label="Main" className="flex flex-wrap gap-1 border-b border-line bg-surface p-2 md:w-64 md:flex-col md:flex-nowrap md:gap-0.5 md:border-b-0 md:border-e md:px-0 md:py-4">
          {NAV.map((n) => (
            <Link key={n.label} href={n.href} aria-current={active(n.label) ? "page" : undefined}
              className={`block border-s-[3px] px-3 py-2 text-sm md:px-5 ${active(n.label) ? "border-gold bg-gold-soft font-semibold text-gold-dark" : `border-transparent hover:bg-gold-soft ${n.href === "#" ? "text-muted" : "text-ink"}`}`}>
              {n.label}
            </Link>
          ))}
        </nav>
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
      <GovFooter />
    </div>
  );
}
