"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal, useModalClose } from "../_ui/Modal";
import { useFormAction } from "../_ui/useFormAction";
import { payDebtAction, type DebtResult } from "./_actions";
import { PAY_METHODS, newIdem } from "../../../../lib/finance/types";
import { formatMoney } from "../../../../lib/admin/format";
import { toDigits, todayIQ } from "../../../../lib/finance/debt-labels";

const num = (v: string) => Number(toDigits(v).replace(/[,\s٬]/g, "")) || 0;

type P = { debtId: string; party: string; direction: string; remaining: number };

export default function PayDebt(p: P) {
  const label = p.direction === "receivable" ? "استلام دفعة" : "تسديد دفعة";
  return (
    <Modal trigger={label} title={label} tone="primary">
      <PayForm {...p} label={label} />
    </Modal>
  );
}

function PayForm({ debtId, party, direction, remaining, label }: P & { label: string }) {
  const router = useRouter();
  const close = useModalClose();
  const { state, pending, onSubmit } = useFormAction<DebtResult>(payDebtAction);
  const [idem, setIdem] = useState(newIdem);
  const [amount, setAmount] = useState(String(remaining));
  const n = num(amount);
  const valid = n > 0 && n <= remaining;

  useEffect(() => { setAmount(String(remaining)); }, [remaining]);
  useEffect(() => {
    if (!state) return;
    if (state.ok) { setIdem(newIdem()); close(); router.refresh(); }
    else if (state.stale) router.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form onSubmit={onSubmit} noValidate>
      <input type="hidden" name="idem" value={idem} />
      <input type="hidden" name="debt_id" value={debtId} />
      <div className="qd-kv"><span>الطرف</span><b>{party}</b></div>
      <div className="qd-kv"><span>المتبقي الحالي</span><b>{formatMoney(remaining)}</b></div>
      <div className="qd-grid2" style={{ marginTop: 12 }}>
        <label className="qd-field">{label === "استلام دفعة" ? "المبلغ المستلم (د.ع)" : "المبلغ المسدد (د.ع)"}
          <input className="qd-input" name="amount" inputMode="numeric" dir="ltr" autoComplete="off" value={amount} onChange={(e) => setAmount(toDigits(e.target.value))} required />
        </label>
        <label className="qd-field">التاريخ
          <input className="qd-input" type="date" name="paid_at" defaultValue={todayIQ()} max={todayIQ()} />
        </label>
        <label className="qd-field">طريقة الدفع
          <select className="qd-input" name="method" defaultValue="cash">
            {PAY_METHODS.map((m) => (<option key={m.value} value={m.value}>{m.label}</option>))}
          </select>
        </label>
        <label className="qd-field">المرجع (اختياري)
          <input className="qd-input" name="reference" maxLength={120} />
        </label>
      </div>
      <label className="qd-field" style={{ marginTop: 10 }}>ملاحظة (اختياري)
        <input className="qd-input" name="note" maxLength={500} />
      </label>
      {n > remaining ? (<div className="qd-msg" data-tone="err" role="alert">المبلغ أكبر من المتبقي.</div>) : null}
      {valid ? (<p className="qd-hint">المتبقي بعد الدفعة: {formatMoney(remaining - n)}</p>) : null}
      {state && !state.ok ? (<div className="qd-msg" data-tone="err" role="alert">{state.message}</div>) : null}
      <button type="submit" className="qd-btn qd-btn-primary" disabled={pending || !valid} style={{ width: "100%", marginTop: 12 }}>
        {pending ? "جارٍ الحفظ…" : direction === "receivable" ? "تأكيد الاستلام" : "تأكيد التسديد"}
      </button>
    </form>
  );
}
