"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { setOfficer } from "@/lib/api";
import { btnCls, inputCls } from "@/components/ui";

export default function Login() {
  const [id, setId] = useState("");
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-navy">
      <form
        className="w-80 rounded-md border-t-4 border-gold bg-white p-6 shadow-lg"
        onSubmit={(e) => {
          e.preventDefault();
          if (!id.trim()) return;
          setOfficer(id.trim());
          router.push("/");
        }}
      >
        <h1 className="text-lg font-semibold text-navy">FTA · veri-tax Officer Console</h1>
        <p className="mb-4 mt-1 text-xs text-slate-500">Mock FTA SSO (prototype). Enter any officer ID.</p>
        <label className="mb-1 block text-xs font-semibold text-slate-600" htmlFor="oid">Officer ID</label>
        <input id="oid" className={`${inputCls} mb-4 w-full`} value={id} onChange={(e) => setId(e.target.value)} placeholder="e.g. officer-001" autoFocus />
        <button className={`${btnCls} w-full`} type="submit">Sign in</button>
        <p className="mt-4 text-center text-xs text-slate-400">Hackathon prototype – not an official FTA service</p>
      </form>
    </div>
  );
}
