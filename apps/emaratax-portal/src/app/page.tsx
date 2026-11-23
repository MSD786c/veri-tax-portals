"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import Shell, { Icon, StatusPill } from "@/components/Shell";
import { aed, getMe, listRequests, useTrn, type RequestStatus, type RequestView } from "@/lib/api";

type Tab = "PENDING" | "RESPONDED" | "CLOSED";
const TABS: Record<Tab, { label: string; statuses: RequestStatus[]; hint: string; empty: string }> = {
  PENDING: { label: "Pending", statuses: ["PENDING"], hint: "Invoices issued under your TRN that the FTA asks you to confirm before the due date.", empty: "Nothing is waiting for your confirmation." },
  RESPONDED: { label: "Responded", statuses: ["RESPONDED"], hint: "Confirmations you have already submitted. No further action is needed.", empty: "You have not submitted any confirmations yet." },
  CLOSED: { label: "Closed", statuses: ["EXPIRED", "CANCELLED"], hint: "Expired: the time limit passed without a response. Cancelled: withdrawn by the FTA, no action needed.", empty: "No expired or cancelled requests." },
};
const CARDS: { tab: Tab; cls: string; icon: string; title: string; note: (n: number) => string }[] = [
  { tab: "PENDING", cls: "t-inv", icon: "clock", title: "Waiting for you", note: (n) => (n ? "Confirm before the due date" : "Nothing to confirm") },
  { tab: "RESPONDED", cls: "t-done", icon: "check", title: "Responded", note: () => "Submitted to the FTA" },
  { tab: "CLOSED", cls: "t-closed", icon: "archive", title: "Closed", note: () => "Expired or withdrawn" },
];

const fdate = (s: string) => new Date(s.slice(0, 10) + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
function due(s: string) {
  const days = Math.ceil((new Date(s).getTime() - Date.now()) / 86_400_000);
  return days < 0 ? `Due ${fdate(s)}` : days === 0 ? "Due today" : `Due in ${days} day${days === 1 ? "" : "s"}`;
}

export default function Dashboard() {
  const trn = useTrn();
  const [rows, setRows] = useState<RequestView[] | null>(null);
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const [tab, setTab] = useState<Tab>("PENDING");
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    if (!trn) return;
    listRequests().then(setRows).catch((e) => setErr(e.message));
    getMe().then((m) => setName(m.legal_name)).catch(() => {});
  }, [trn]);
  useEffect(() => { const t = setTimeout(() => setNow(new Date())); return () => clearTimeout(t); }, []);

  const inTab = (t: Tab) => rows?.filter((r) => TABS[t].statuses.includes(r.request.status)) ?? [];
  const count = (t: Tab) => inTab(t).length;
  const shown = inTab(tab).sort((a, b) => a.request.due_at.localeCompare(b.request.due_at));
  const pending = count("PENDING");
  const hour = now?.getHours() ?? 9;
  const pick = (t: Tab) => { setTab(t); document.getElementById("requests")?.scrollIntoView({ behavior: "smooth", block: "start" }); };

  return (
    <Shell>
      <header className="page-h">
        <div className="hello">
          {now && <div className="daytile" aria-hidden="true"><span>{now.toLocaleString("en", { month: "short" })}</span><b>{now.getDate()}</b></div>}
          <div>
            <p className="eyebrow">{now?.toLocaleString("en", { weekday: "long" }) ?? "Supplier dashboard"}</p>
            <h1>{hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"}{name && `, ${name}`}</h1>
            <p className="lead">
              {!rows ? "VAT refund confirmation requests for invoices issued under your TRN."
                : pending ? `${pending} invoice${pending === 1 ? " is" : "s are"} waiting for your confirmation.` : "You are all caught up. No invoices need your confirmation."}
            </p>
          </div>
        </div>
        {shown[0] && tab === "PENDING" && (
          <div className="page-actions">
            <Link className="btn primary md" href={`/requests/${shown[0].request.id}`}><span>Confirm next invoice</span><Icon n="arrow" s={18} /></Link>
          </div>
        )}
      </header>

      <section className="tasks" aria-label="Your requests">
        {CARDS.map((c) => (
          <article key={c.tab} className={`task ${c.cls}`}>
            <header><span className="task-ic"><Icon n={c.icon} /></span><p>{c.title}</p></header>
            <b>{rows ? count(c.tab) : "–"}</b>
            <small>{c.note(count(c.tab))}</small>
            <footer><button type="button" className="task-go" onClick={() => pick(c.tab)}>Show list<Icon n="arrow" s={16} /></button></footer>
          </article>
        ))}
      </section>

      <section id="requests" className="card nopad queue-card">
        <header className="card-h">
          <h2>Confirmation requests</h2>
          <div className="seg" role="tablist" aria-label="Filter requests">
            {(Object.keys(TABS) as Tab[]).map((t) => (
              <button key={t} type="button" role="tab" aria-selected={tab === t} className={tab === t ? "on" : ""} onClick={() => setTab(t)}>
                {TABS[t].label} <span className="num">{count(t)}</span>
              </button>
            ))}
          </div>
        </header>
        <p className="queue-hint">{TABS[tab].hint}</p>
        {err && <p role="alert" className="err banner q-err">Could not load requests: {err}</p>}
        {!rows && !err && <p className="muted center">Loading requests…</p>}
        {rows && (shown.length ? (
          <ul className="queue">
            {shown.map(({ request: q, invoice: i, application: a }, n) => (
              <li key={q.id}>
                <Link className="queue-row" href={`/requests/${q.id}`}>
                  <span className="q-n">{String(n + 1).padStart(2, "0")}</span>
                  <span className="q-ic"><Icon n="file" s={18} /></span>
                  <span className="q-main">
                    <b>{i.invoice_no} · {a.applicant_name}</b>
                    <small>{fdate(i.invoice_date)} · Plot {a.plot_no} · VAT {aed(i.vat_amount)} · Total {aed(i.total)}</small>
                  </span>
                  <span className="q-when">{q.status === "PENDING" ? due(q.due_at) : `Sent ${fdate(q.sent_at)}`}</span>
                  <StatusPill status={q.status} />
                  <span className="q-go"><Icon n="chevr" s={16} /></span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="empty">
            <span className="empty-ic"><Icon n="check" s={26} /></span>
            <h3>No {TABS[tab].label.toLowerCase()} requests</h3>
            <p>{TABS[tab].empty}</p>
          </div>
        ))}
      </section>
    </Shell>
  );
}
