"use server";

import { revalidatePath } from "next/cache";
import { requireAnyPermission } from "../../../lib/admin/access";
import { createClient } from "../../../lib/supabase/server";
import { addStoreDebt, recordDebtPayment } from "../../../lib/finance/service";
import type { PayMethod } from "../../../lib/finance/types";
import type { ActionState } from "./_actions";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const num = (f: FormData, k: string) =>
  Math.round(Number(str(f, k).replace(/[,\s]/g, "")));
const today = () => new Date().toISOString().slice(0, 10);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function addStoreDebtAction(
  _: ActionState,
  f: FormData,
): Promise<ActionState> {
  await requireAnyPermission(["store_debts"]);
  const amount = num(f, "amount");
  const customer = str(f, "customer");
  const order = str(f, "order");
  if (!UUID.test(customer)) return { ok: false, message: "اختر الزبون" };
  if (!Number.isFinite(amount) || amount <= 0)
    return { ok: false, message: "المبلغ يجب أن يكون أكبر من صفر" };
  if (order && !UUID.test(order))
    return { ok: false, message: "رقم الطلب غير صحيح" };

  const s = await createClient();
  const { data: c } = await s
    .from("customers")
    .select("full_name")
    .eq("id", customer)
    .maybeSingle();

  const r = await addStoreDebt({
    customer,
    party: c?.full_name ?? undefined,
    amount,
    debtDate: str(f, "debt_date") || today(),
    due: str(f, "due") || null,
    order: order || null,
    reason: str(f, "reason"),
    notes: str(f, "notes"),
    idem: str(f, "idem"),
  });
  if (!r.ok) return { ok: false, message: r.error };
  revalidatePath("/admin/debts/store");
  return { ok: true, message: "تم تسجيل الدين" };
}

export async function payStoreDebtAction(
  _: ActionState,
  f: FormData,
): Promise<ActionState> {
  await requireAnyPermission(["store_debts"]);
  const amount = num(f, "amount");
  if (!Number.isFinite(amount) || amount <= 0)
    return { ok: false, message: "المبلغ يجب أن يكون أكبر من صفر" };
  const r = await recordDebtPayment({
    store: str(f, "debt_id"),
    amount,
    paidAt: str(f, "paid_at") || today(),
    method: (str(f, "method") || "cash") as PayMethod,
    reference: str(f, "reference"),
    note: str(f, "note"),
    idem: str(f, "idem"),
  });
  if (!r.ok) return { ok: false, message: r.error };
  revalidatePath("/admin/debts/store");
  return { ok: true, message: "تم تسجيل الدفعة" };
}
