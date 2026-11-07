"use client";

import { useActionState, useEffect, useState } from "react";
import { addStoreDebtAction, payStoreDebtAction } from "../_store_actions";
import { PAY_METHODS, newIdem } from "../../../../lib/finance/types";

type S = { ok: boolean; message: string } | null;
type Cust = { id: string; full_name: string; phone: string | null };

function Msg({ s }: { s: S }) {
  if (!s) return null;
  return <div className={"qa-note " + (s.ok ? "qa-ok" : "qa-err")}>{s.message}</div>;
}

export function AddStoreDebtForm({ customers }: { customers: Cust[] }) {
  const [state, action, pending] = useActionState(addStoreDebtAction, null);
  const [idem, setIdem] = useState(newIdem);
  useEffect(() => {
    if (state?.ok) setIdem(newIdem());
  }, [state]);
  return (
    <details className="qa-card qa-details">
      <summary>إضافة دين على زبون</summary>
      <form className="qa-form" action={action}>
        <input type="hidden" name="idem" value={idem} />
        <label className="qa-label">الزبون</label>
        <select className="qa-input" name="customer" required defaultValue="">
          <option value="" disabled>اختر الزبون</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.full_name}{c.phone ? " - " + c.phone : ""}
            </option>
          ))}
        </select>
        <label className="qa-label">المبلغ (د.ع)</label>
        <input className="qa-input" name="amount" inputMode="numeric" required />
        <label className="qa-label">تاريخ الدين</label>
        <input className="qa-input" name="debt_date" type="date" />
        <label className="qa-label">تاريخ الاستحقاق</label>
        <input className="qa-input" name="due" type="date" />
        <label className="qa-label">معرّف الطلب (اختياري)</label>
        <input className="qa-input" name="order" dir="ltr" />
        <label className="qa-label">السبب</label>
        <input className="qa-input" name="reason" />
        <label className="qa-label">ملاحظات إدارية</label>
        <input className="qa-input" name="notes" />
        <button className="qa-btn" disabled={pending}>
          {pending ? "جارٍ الحفظ" : "حفظ الدين"}
        </button>
        <Msg s={state} />
      </form>
    </details>
  );
}

export function PayStoreForm({ debtId, remaining }: { debtId: string; remaining: number }) {
  const [state, action, pending] = useActionState(payStoreDebtAction, null);
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
            <option key={m.value} value={m.value}>{m.label}</option>
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
