"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { setTrn, TEST_SUPPLIERS } from "@/lib/api";

export default function Login() {
  const router = useRouter();
  const [trn, setValue] = useState(TEST_SUPPLIERS[0].trn);
  const go = (t: string) => { setTrn(t.trim()); router.replace("/"); };
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b-4 border-gold bg-white px-6 py-3">
        <div className="text-2xl font-bold text-gold">EmaraTax</div>
        <div className="text-xs text-muted">Federal Tax Authority</div>
      </header>
      <main className="flex flex-1 items-center justify-center p-6">
        <form className="card w-full max-w-md space-y-4" onSubmit={(e) => { e.preventDefault(); go(trn); }}>
          <h1 className="text-xl font-semibold">Sign in with UAE PASS <span className="pill bg-gray-200 text-gray-700">mock</span></h1>
          <p className="text-sm text-muted">Prototype only: choose a test supplier or enter a TRN. No password is required.</p>
          <div className="space-y-2">
            {TEST_SUPPLIERS.map((s) => (
              <label key={s.trn} className="flex cursor-pointer items-center gap-3 rounded border border-line p-2 text-sm hover:bg-page">
                <input type="radio" name="trn" checked={trn === s.trn} onChange={() => setValue(s.trn)} />
                <span>{s.name}<br /><span className="text-xs text-muted">{s.trn}</span></span>
              </label>
            ))}
          </div>
          <div>
            <label className="label" htmlFor="trn">Or enter a TRN</label>
            <input id="trn" className="input" inputMode="numeric" value={trn} onChange={(e) => setValue(e.target.value)} />
          </div>
          <button className="btn w-full" disabled={!trn.trim()}>Sign in</button>
        </form>
      </main>
      <footer className="border-t border-line bg-white px-6 py-2 text-center text-xs text-muted">
        Hackathon prototype – not an official FTA service
      </footer>
    </div>
  );
}
