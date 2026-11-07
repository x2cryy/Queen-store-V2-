"use client";

import { useActionState, useEffect, useState } from "react";
import { addPersonalDebtAction, payPersonalDebtAction } from "../_actions";
import { PAY_METHODS, newIdem } from "../../../../lib/finance/types";

type S = { ok: boolean; message: string } | null;

function Msg({ s }: { s: S }) {
  if (!s) return null;
  return <div className={"qa-note " + (s.ok ? "qa-ok" : "qa-err")}>{s.message}</div>;
}

export function AddDebtForm() {
  const [state, action, pending] = useActionState(addPersonalDebtAction, null);
  const [idem, setIdem] = useState(newIdem);
  useEffect(() => {
    if (state?.ok) setIdem(newIdem());
  }, [state]);
  return (
    <details className="qa-card qa-details">
      <summary>إضافة دين شخصي</summary>
      <form className="qa-form" action={action}>
        <input type="hidden" name="idem" value={idem} />
        <label className="qa-label">الاسم أو الجهة</label>
        <input className="qa-input" name="party" required />
        <label className="qa-label">النوع</label>
        <select className="qa-input" name="direction" defaultValue="payable">
          <option value="payable">عليّ (أدين به)</option>
          <option value="receivable">لي (مستحق لي)</option>
        </select>
        <label className="qa-label">المبلغ (د.ع)</label>
        <input className="qa-input" name="amount" inputMode="numeric" required />
        <label className="qa-label">تاريخ الدين</label>
        <input className="qa-input" name="debt_date" type="date" />
        <label className="qa-label">تاريخ الاستحقاق</label>
        <input className="qa-input" name="due" type="date" />
        <label className="qa-label">السبب</label>
        <input className="qa-input" name="reason" />
        <label className="qa-label">ملاحظات</label>
        <input className="qa-input" name="notes" />
        <button className="qa-btn" disabled={pending}>
          {pending ? "جارٍ الحفظ" : "حفظ الدين"}
        </button>
        <Msg s={state} />
      </form>
    </details>
  );
}

export function PayForm({ debtId, remaining }: { debtId: string; remaining: number }) {
  const [state, action, pending] = useActionState(payPersonalDebtAction, null);
  const [idem, setIdem] = useState(newIdem);
  useEffect(() => {
    if (state?.ok) setIdem(newIdem());
  }, [state]);
  return (
    <details className="qa-details">
      <summary>تسجيل دفعة</summary>
      <form className="qa-form" action={action}>
        <input type="hidden" name="idem" value={idem} />
        <input type="hidden" name="debt_id" value={debtId} />
        <label className="qa-label">
          المبلغ (المتبقي {remaining.toLocaleString("en-US")})
        </label>
        <input className="qa-input" name="amount" inputMode="numeric" required />
        <label className="qa-label">طريقة الدفع</label>
        <select className="qa-input" name="method" defaultValue="cash">
          {PAY_METHODS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
        <label className="qa-label">التاريخ</label>
        <input className="qa-input" name="paid_at" type="date" />
        <label className="qa-label">رقم مرجعي</label>
        <input className="qa-input" name="reference" />
        <label className="qa-label">ملاحظات</label>
        <input className="qa-input" name="note" />
        <button className="qa-btn" disabled={pending}>
          {pending ? "جارٍ الحفظ" : "تأكيد الدفعة"}
        </button>
        <Msg s={state} />
      </form>
    </details>
  );
}
