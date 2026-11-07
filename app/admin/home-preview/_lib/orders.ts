import { formatDate } from "./utils";
import type { Order, OrderStatus, PayStatus } from "../_data/mock";

export type Tone = "green" | "blue" | "red" | "amber" | "gray";

export const STATUS_META: Record<OrderStatus, { label: string; tone: Tone }> = {
  new: { label: "جديد", tone: "blue" },
  processing: { label: "قيد التجهيز", tone: "amber" },
  done: { label: "مكتمل", tone: "green" },
  cancelled: { label: "ملغي", tone: "red" },
  returned: { label: "مرتجع", tone: "gray" },
};

export const PAY_META: Record<PayStatus, { label: string; tone: Tone }> = {
  paid: { label: "مدفوع", tone: "green" },
  partial: { label: "مدفوع جزئيًا", tone: "amber" },
  unpaid: { label: "غير مدفوع", tone: "gray" },
};

export function orderTotals(o: Order) {
  const subtotal = o.items.reduce((s, i) => s + i.qty * i.unit, 0);
  const discount = o.discount ?? 0;
  const fees = o.fees.reduce((s, f) => s + f.amount, 0);
  return { subtotal, discount, fees, total: subtotal - discount + fees };
}

export const itemCount = (o: Order) => o.items.reduce((s, i) => s + i.qty, 0);

export function fullDateTime(createdAt: string) {
  const d = new Date(Date.parse(createdAt) + 3 * 3_600_000);
  const iso = d.toISOString().slice(0, 10);
  let h = d.getUTCHours();
  const m = String(d.getUTCMinutes()).padStart(2, "0");
  const part = h >= 12 ? "م" : "ص";
  h = h % 12 || 12;
  return `${formatDate(iso)} - ${h}:${m} ${part}`;
}
