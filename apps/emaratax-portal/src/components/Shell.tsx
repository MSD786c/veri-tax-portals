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

export function StatusPill({ status }: { status: string }) {
  const c: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-800", AWAITING_SUPPLIER: "bg-amber-100 text-amber-800",
    RESPONDED: "bg-sky-100 text-sky-800", VERIFIED: "bg-green-100 text-green-800",
    FLAGGED: "bg-orange-100 text-orange-800", DISPUTED: "bg-red-100 text-red-800",
    EXPIRED: "bg-gray-200 text-gray-700",
  };
  return <span className={`pill ${c[status] ?? "bg-gray-100 text-gray-700"}`}>{status.replace(/_/g, " ")}</span>;
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

  if (!trn) return null;
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b-4 border-gold bg-white px-6 py-3">
        <div>
          <div className="text-2xl font-bold tracking-tight text-gold">EmaraTax</div>
          <div className="text-xs text-muted">Federal Tax Authority</div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-right">{me?.legal_name}<br /><span className="text-xs text-muted">TRN {trn}</span></span>
          <button className="btn-ghost" onClick={() => { setTrn(null); router.replace("/login"); }}>Log out</button>
        </div>
      </header>
      <div className="flex flex-1 flex-col md:flex-row">
        <nav className="border-b border-line bg-white p-3 md:w-60 md:border-b-0 md:border-e">
          {NAV.map((n) => (
            <Link key={n.label} href={n.href}
              className={`block rounded px-3 py-2 text-sm ${n.href === path && n.label === "Dashboard" ? "bg-gold-soft font-semibold text-gold-dark" : "hover:bg-page"} ${n.href === "#" ? "text-muted" : ""}`}>
              {n.label}
            </Link>
          ))}
        </nav>
        <main className="flex-1 p-6">{children}</main>
      </div>
      <footer className="border-t border-line bg-white px-6 py-2 text-center text-xs text-muted">
        Hackathon prototype – not an official FTA service
      </footer>
    </div>
  );
}
