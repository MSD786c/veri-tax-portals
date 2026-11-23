"use client";
import { useState } from "react";
import { openDocument } from "@/lib/api";

export function OpenDocButton({ id, label = "Open original" }: { id: number; label?: string }) {
  const [err, setErr] = useState("");
  return (
    <span className="whitespace-nowrap">
      <button
        className="rounded border border-gold px-2.5 py-1 text-xs font-semibold text-gold hover:bg-gold hover:text-white"
        onClick={() => openDocument(id).then(() => setErr(""), (e: Error) => setErr(e.message))}
      >
        {label}
      </button>
      {err && <span className="ml-2 text-xs text-red-700">{err}</span>}
    </span>
  );
}
