"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getMe, setTrn, useTrn, type Supplier } from "@/lib/api";

// Same stroke icon set as the FTA portal (fta-portal/src/components/ui.tsx).
const ICONS: Record<string, string> = {
  home: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  shield: "M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6z",
  doc: "M7 3h8l4 4v14H7z M15 3v4h4 M10 12h6 M10 16h6",
  file: "M6 3h12v18l-3-2-3 2-3-2-3 2z M9 8h6 M9 12h6",
  building: "M4 21V5l8-2v18 M12 9l8 2v10 M2 21h20 M8 9h1 M8 13h1 M8 17h1 M16 14h1 M16 18h1",
  check: "M5 12.5l4.5 4.5L19 7",
  clock: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M12 7v5l3 2",
  x: "M6 6l12 12 M18 6L6 18",
  arrow: "M5 12h14 M13 6l6 6-6 6",
  chevron: "M6 9l6 6 6-6",
  chevr: "M9 6l6 6-6 6",
  chevl: "M15 6l-6 6 6 6",
  logout: "M10 4H5v16h5 M15 8l4 4-4 4 M19 12H9",
  menu: "M4 7h16 M4 12h16 M4 17h16",
  lock: "M6 11h12v9H6z M8 11V8a4 4 0 0 1 8 0v3",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M4 21a8 8 0 0 1 16 0",
  archive: "M3 5h18v4H3z M5 9v11h14V9 M10 13h4",
};

export function Icon({ n, s = 20 }: { n: string; s?: number }) {
  return (
    <svg className="ic" width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICONS[n] ?? ICONS.doc} />
    </svg>
  );
}

// Badge tones reuse the FTA portal classes: approved = green, referred = amber, neutral = grey.
const TONE: Record<string, string> = { PENDING: "referred", RESPONDED: "approved", EXPIRED: "neutral", CANCELLED: "neutral" };

export function StatusPill({ status }: { status: string }) {
  const label = status.replace(/_/g, " ").toLowerCase();
  return <span className={`badge ${TONE[status] ?? "neutral"}`}>{label[0].toUpperCase() + label.slice(1)}</span>;
}

export function Brand({ dark = false }: { dark?: boolean }) {
  return <div className={`brand${dark ? " on-dark" : ""}`}><div><b>EmaraTax</b><small>Federal Tax Authority e-Services</small></div></div>;
}

const NAV = [
  { href: "/", icon: "home", label: "Dashboard" },
  { href: "/#requests", icon: "file", label: "Confirmations" },
];

const initials = (name?: string) => (name ?? "").split(/\s+/).filter((w) => /^[A-Za-z]/.test(w)).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

export default function Shell({ children }: { children: React.ReactNode }) {
  const trn = useTrn();
  const router = useRouter();
  const path = usePathname();
  const [me, setMe] = useState<Supplier | null>(null);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    if (trn === null) router.replace("/login");
    else if (trn) getMe().then(setMe).catch(() => setTrn(null));
  }, [trn, router]);

  const active = (label: string) =>
    (label === "Dashboard" && path === "/") || (label === "Confirmations" && path.startsWith("/requests"));
  const logout = () => { setTrn(null); router.replace("/login"); };

  if (!trn) return null;
  return (
    <div className="app">
      <input type="checkbox" id="menu" className="menu-toggle" aria-label="Open navigation" checked={menu} onChange={(e) => setMenu(e.target.checked)} />
      <a href="#main" className="skip">Skip to content</a>
      <aside className="side" aria-label="Main navigation">
        <Brand />
        <nav>
          <ul>
            {NAV.map((n) => (
              <li key={n.label}>
                <Link href={n.href} onClick={() => setMenu(false)} className={active(n.label) ? "on" : ""} aria-current={active(n.label) ? "page" : undefined}>
                  <Icon n={n.icon} s={20} /><span>{n.label}</span>
                </Link>
              </li>
            ))}
          </ul>
          <ul className="side-bottom">
            <li><button type="button" className="side-out" onClick={logout}><Icon n="logout" s={20} /><span>Sign out</span></button></li>
          </ul>
        </nav>
        <div className="side-meta"><small>Signed in as</small><b>{me?.legal_name ?? "Supplier"}</b><span><i />TRN <span className="mono">{trn}</span></span></div>
      </aside>
      <label htmlFor="menu" className="menu-scrim" aria-label="Close navigation" />
      <div className="main-col">
        <header className="top">
          <label htmlFor="menu" className="icon-btn menu-btn" aria-label="Open navigation"><Icon n="menu" s={20} /></label>
          <p className="top-ctx"><Icon n="shield" s={17} /><span>VAT refund confirmations for suppliers</span></p>
          <div className="top-right">
            <details className="pop-wrap">
              <summary className="user" aria-haspopup="menu">
                <span className="avatar">{initials(me?.legal_name) || "S"}</span>
                <span className="user-n">{me?.legal_name ?? "Supplier"}</span><Icon n="chevron" s={16} />
              </summary>
              <div className="pop right">
                <div className="pop-user"><span className="avatar lg">{initials(me?.legal_name) || "S"}</span><div><b>{me?.legal_name}</b><small>TRN {trn}</small></div></div>
                {me && <p className="pop-addr"><span className="pop-ic"><Icon n="building" s={17} /></span>{me.address}, {me.emirate}</p>}
                <button type="button" className="pop-btn" onClick={logout}><span className="pop-ic"><Icon n="logout" s={17} /></span>Sign out</button>
              </div>
            </details>
          </div>
        </header>
        <main id="main" className="content" tabIndex={-1}><div>{children}</div></main>
      </div>
    </div>
  );
}
