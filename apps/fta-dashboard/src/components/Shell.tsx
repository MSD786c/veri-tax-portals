"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { clearOfficer, getOfficer } from "@/lib/api";

const NAV = [
  { href: "/", label: "Overview" },
  { href: "/applications", label: "Applications" },
  { href: "/suppliers", label: "Suppliers" },
  { href: "/rejections", label: "Rejections" },
];

// "" = not signed in, undefined = server render
const sub = (cb: () => void) => {
  window.addEventListener("storage", cb);
  return () => window.removeEventListener("storage", cb);
};

export default function Shell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const officer = useSyncExternalStore(sub, () => getOfficer() ?? "", () => undefined);
  const isLogin = path === "/login";

  useEffect(() => {
    if (officer === "" && !isLogin) router.replace("/login");
  }, [officer, isLogin, router]);

  if (isLogin) return <>{children}</>;
  if (officer === "") return null; // redirecting to /login (undefined = SSR: render the shell so pages prerender)

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-56 shrink-0 flex-col bg-navy text-slate-200">
        <div className="border-b-2 border-gold px-4 py-4 text-sm font-semibold leading-tight text-white">
          FTA · veri-tax
          <div className="text-xs font-normal text-gold">Officer Console</div>
        </div>
        <nav className="flex-1 py-2">
          {NAV.map((n) => {
            const active = n.href === "/" ? path === "/" : path.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`block border-l-4 px-4 py-2.5 hover:bg-navy-2 ${active ? "border-gold bg-navy-2 text-white" : "border-transparent"}`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-700 px-4 py-3 text-xs">
          Officer: <span className="font-mono text-white">{officer ?? ""}</span>
          <button
            className="mt-1 block text-gold hover:underline"
            onClick={() => {
              clearOfficer();
              router.replace("/login");
            }}
          >
            Sign out
          </button>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1 p-6">{children}</main>
        <footer className="px-6 py-3 text-xs text-slate-500">Hackathon prototype – not an official FTA service</footer>
      </div>
    </div>
  );
}
