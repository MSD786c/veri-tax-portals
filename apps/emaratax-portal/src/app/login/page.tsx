"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { GovFooter, GovHeader } from "@/components/Shell";
import { setTrn, TEST_SUPPLIERS } from "@/lib/api";

export default function Login() {
  const router = useRouter();
  const [trn, setValue] = useState(TEST_SUPPLIERS[0].trn);
  const go = (t: string) => { setTrn(t.trim()); router.replace("/"); };
  return (
    <div className="flex min-h-screen flex-col">
      <GovHeader />
      <main className="flex flex-1 items-start justify-center px-4 py-10 sm:py-16">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-semibold tracking-tight">Log in to EmaraTax</h1>
          <p className="mt-1 mb-6 text-sm text-muted">Supplier access to VAT refund confirmation requests.</p>
          <form className="card space-y-5 p-6" onSubmit={(e) => { e.preventDefault(); go(trn); }}>
            <div className="flex items-center justify-between gap-3 border-b border-line pb-4">
              <h2 className="font-semibold">Sign in with UAE PASS</h2>
              <span className="pill pill-neutral">Mock</span>
            </div>
            <p className="text-sm text-muted">Prototype only: choose a test supplier or enter a TRN. No password is required.</p>
            <fieldset className="space-y-2">
              <legend className="label">Test supplier</legend>
              {TEST_SUPPLIERS.map((s) => (
                <label key={s.trn}
                  className={`flex cursor-pointer items-center gap-3 rounded-ctl border px-3 py-2 text-sm ${trn === s.trn ? "border-gold bg-gold-soft" : "border-line hover:bg-gold-soft"}`}>
                  <input type="radio" name="trn" checked={trn === s.trn} onChange={() => setValue(s.trn)} />
                  <span className="leading-tight"><span className="block font-medium">{s.name}</span><span className="block text-xs tabular-nums text-muted">{s.trn}</span></span>
                </label>
              ))}
            </fieldset>
            <div>
              <label className="label" htmlFor="trn">Or enter a TRN</label>
              <input id="trn" className="input tabular-nums" inputMode="numeric" value={trn} onChange={(e) => setValue(e.target.value)} />
            </div>
            <button className="btn w-full py-2.5" disabled={!trn.trim()}>Sign in</button>
          </form>
        </div>
      </main>
      <GovFooter />
    </div>
  );
}
