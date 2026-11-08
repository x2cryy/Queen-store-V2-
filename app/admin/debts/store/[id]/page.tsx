import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAnyPermission } from "../../../../../lib/admin/access";
import { getStoreDebt } from "../../../../../lib/finance/queries";
import { createClient } from "../../../../../lib/supabase/server";
import { iqd } from "../../../../../lib/finance/types";
import { PayStoreForm } from "../Forms";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STATUS: Record<string, string> = {
  open: "غير مدفوع",
  partial: "مدفوع جزئياً",
  paid: "مدفوع بالكامل",
  cancelled: "ملغي",
  late: "متأخر",
};
const METHOD: Record<string, string> = { cash: "نقدي", transfer: "تحويل", card: "بطاقة", manual: "يدوي", qi_card: "كي كارد" };

type Debt = {
  id: string;
  customer_id: string | null;
  party_name: string;
  original_amount: number;
  paid_amount: number;
  debt_date: string;
  due_date: string | null;
  order_id: string | null;
  reason: string | null;
  notes: string | null;
  status: string;
};
type Pay = {
  id: string;
  amount: number;
  paid_at: string;
  method: string;
  reference: string | null;
  note: string | null;
  reversed_at: string | null;
  reversal_reason: string | null;
};

export default async function StoreDebtPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAnyPermission(["store_debts"]);
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const { debt, pays } = await getStoreDebt(id);
  if (!debt) notFound();
  const d = debt as unknown as Debt;
  const rows = (pays ?? []) as unknown as Pay[];

  let orderNumber: string | null = null;
  if (d.order_id) {
    const sb = await createClient();
    const { data } = await sb.from("orders").select("order_number").eq("id", d.order_id).maybeSingle();
    orderNumber = (data as { order_number: string } | null)?.order_number ?? null;
  }

  const original = Number(d.original_amount) || 0;
  const paid = Number(d.paid_amount) || 0;
  const left = Math.max(0, original - paid);
  const today = new Date().toISOString().slice(0, 10);
  const late = d.due_date && d.due_date < today && (d.status === "open" || d.status === "partial");
  const statusKey = late ? "late" : d.status;
  const canPay = d.status !== "cancelled" && left > 0;

  return (
    <section>
      <p className="qs-muted">
        <Link href="/admin/debts/store">العودة إلى ديون المتجر</Link>
      </p>
      <h1 className="qs-h1">{d.party_name}</h1>
      <p className="qs-muted">
        حالة الدين: {STATUS[statusKey] ?? d.status}
        {d.due_date ? " - الاستحقاق: " + d.due_date : ""}
      </p>

      <div className="qa-card">
        <div className="qa-row"><span>مبلغ الدين</span><b>{iqd(original)}</b></div>
        <div className="qa-row"><span>المسدد</span><b>{iqd(paid)}</b></div>
        <div className="qa-row"><span>المتبقي</span><b>{iqd(left)}</b></div>
        <div className="qa-row"><span>تاريخ الدين</span><b>{d.debt_date}</b></div>
        {orderNumber ? (
          <div className="qa-row">
            <span>الطلب المرتبط</span>
            <b>
              <Link href={"/admin/orders/" + d.order_id}>{orderNumber}</Link>
            </b>
          </div>
        ) : null}
        {d.customer_id ? (
          <div className="qa-row">
            <span>ملف العميل</span>
            <b>
              <Link href={"/admin/customers/" + d.customer_id}>فتح الملف</Link>
            </b>
          </div>
        ) : null}
        {d.reason ? <div className="qa-row"><span>السبب</span><b>{d.reason}</b></div> : null}
        {d.notes ? <div className="qa-row"><span>ملاحظة</span><b>{d.notes}</b></div> : null}
      </div>

      {canPay ? (
        <div className="qa-card">
          <h2>تسجيل دفعة</h2>
          <PayStoreForm debtId={d.id} remaining={left} />
        </div>
      ) : null}

      <div className="qa-card">
        <h2>سجل الدفعات</h2>
        {rows.length === 0 ? (
          <p className="qs-muted">لا توجد دفعات مسجلة على هذا الدين.</p>
        ) : (
          rows.map((p) => (
            <div
              key={p.id}
              className="qa-row"
              style={{ flexWrap: "wrap", textDecoration: p.reversed_at ? "line-through" : "none" }}
            >
              <span>
                {p.paid_at} - {METHOD[p.method] ?? p.method}
                {p.reference ? " - " + p.reference : ""}
              </span>
              <b>{iqd(Number(p.amount) || 0)}</b>
              {p.reversed_at ? (
                <small style={{ width: "100%", textDecoration: "none" }}>
                  ملغاة{p.reversal_reason ? ": " + p.reversal_reason : ""}
                </small>
              ) : null}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
