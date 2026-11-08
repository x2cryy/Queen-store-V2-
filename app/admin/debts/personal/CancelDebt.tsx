"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Modal, useModalClose } from "../_ui/Modal";
import { useFormAction } from "../_ui/useFormAction";
import { cancelDebtAction, type DebtResult } from "./_actions";

export default function CancelDebt({ id }: { id: string }) {
  return (
    <Modal trigger="إلغاء الدين" title="إلغاء الدين" tone="danger">
      <CancelForm id={id} />
    </Modal>
  );
}

function CancelForm({ id }: { id: string }) {
  const router = useRouter();
  const close = useModalClose();
  const { state, pending, onSubmit } = useFormAction<DebtResult>(cancelDebtAction);
  useEffect(() => {
    if (state?.ok) { close(); router.refresh(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
  return (
    <form onSubmit={onSubmit}>
      <input type="hidden" name="id" value={id} />
      <p>لا يُحذف الدين: يبقى في السجل بحالة «ملغي» ولا يدخل الملخصات. متاح فقط لدين بلا أي دفعات.</p>
      {state && !state.ok ? (<div className="qd-msg" data-tone="err" role="alert">{state.message}</div>) : null}
      <div className="qd-actions">
        <button type="submit" className="qd-btn qd-btn-danger" disabled={pending}>{pending ? "جارٍ الإلغاء…" : "تأكيد الإلغاء"}</button>
        <button type="button" className="qd-btn" onClick={close}>تراجع</button>
      </div>
    </form>
  );
}
