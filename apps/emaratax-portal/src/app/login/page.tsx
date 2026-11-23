"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Brand, Icon } from "@/components/Shell";
import { setTrn, TEST_SUPPLIERS } from "@/lib/api";

export default function Login() {
  const router = useRouter();
  const [trn, setValue] = useState(TEST_SUPPLIERS[0].trn);
  const go = (t: string) => { setTrn(t.trim()); router.replace("/"); };
  return (
    <div className="login login-split">
      <section className="login-art">
        <Brand dark />
        <div className="login-copy">
          <h1>Confirm the invoices you issued</h1>
          <p>The FTA asks suppliers to confirm tax invoices that homeowners submit with a VAT refund claim.</p>
          <ul className="login-points">
            <li><span><Icon n="file" /></span><div><b>Review the particulars</b><p>Check the invoice number, date and amounts the applicant submitted.</p></div></li>
            <li><span><Icon n="check" /></span><div><b>Answer four questions</b><p>Confirm you issued it, whether it was paid, and the VAT return period.</p></div></li>
            <li><span><Icon n="clock" /></span><div><b>Respond before the due date</b><p>Requests close automatically when the time limit passes.</p></div></li>
          </ul>
        </div>
        <small className="login-foot">Federal Tax Authority · United Arab Emirates</small>
      </section>
      <section className="login-form">
        <div className="login-box">
          <div className="login-brand"><b>EmaraTax</b><small>Federal Tax Authority e-Services</small></div>
          <h2>Sign in</h2>
          <p className="lead">Sign in with UAE PASS to see confirmation requests for your TRN.</p>
          <form onSubmit={(e) => { e.preventDefault(); go(trn); }}>
            <fieldset className="sup-pick">
              <legend>Test supplier <span className="badge neutral">UAE PASS mock</span></legend>
              <div className="sup-list">
                {TEST_SUPPLIERS.map((s) => (
                  <label key={s.trn} className={trn === s.trn ? "on" : ""}>
                    <input type="radio" name="trn" className="sr" checked={trn === s.trn} onChange={() => setValue(s.trn)} />
                    <span><b>{s.name}</b><small className="mono">{s.trn}</small></span>
                    <i aria-hidden="true"><Icon n="check" s={14} /></i>
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="field">
              <label htmlFor="trn">Or enter a TRN</label>
              <input id="trn" className="mono" inputMode="numeric" autoComplete="off" value={trn} onChange={(e) => setValue(e.target.value)} />
            </div>
            <button className="btn primary lg full" disabled={!trn.trim()}><span>Continue with UAE PASS</span><Icon n="arrow" s={18} /></button>
          </form>
          <p className="login-note"><Icon n="lock" s={15} /> Prototype only. No password is required.</p>
        </div>
      </section>
    </div>
  );
}
