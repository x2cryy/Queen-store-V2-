import { requireAnyPermission } from "../../../../lib/admin/access";
import { listPersonalDebts } from "../../../../lib/finance/queries";
import { iqd } from "../../../../lib/finance/types";
import { AddDebtForm, PayForm } from "./Forms";

const STATUS: Record<string, string> = {
  open: "غير مدفوع",
  partial: "مدفوع جزئياً",
  paid: "مدفوع بالكامل",
  cancelled: "ملغي",
  late: "متأخر",
};

export default async function Page() {
  await requireAnyPermission(["personal_debts"]);
  const { rows, error } = await listPersonalDebts();
  const today = new Date().toISOString().slice(0, 10);
  const eff = (r: (typeof rows)[number]) =>
    r.due_date && r.due_date < today && (r.status === "open" || r.status === "partial")
      ? "late"
      : r.status;

  const live = rows.filter((r) => r.status !== "cancelled");
  const sum = (
    dir: string,
    k: "original_amount" | "paid_amount" | "remaining_amount",
  ) => live.filter((r) => r.direction === dir).reduce((a, r) => a + Number(r[k]), 0);

  return (
    <section>
      <h1 className="qs-h1">الديون الشخصية</h1>
      <p className="qs-muted">منفصلة تماماً عن مبيعات المتجر وأرباحه.</p>
      {error && <div className="qa-note qa-err">تعذر تحميل البيانات</div>}

      <div className="qa-card">
        <div className="qa-row"><span>إجمالي ما عليّ</span><b>{iqd(sum("payable", "original_amount"))}</b></div>
        <div className="qa-row"><span>المدفوع</span><b>{iqd(sum("payable", "paid_amount"))}</b></div>
        <div className="qa-row"><span>المتبقي عليّ</span><b>{iqd(sum("payable", "remaining_amount"))}</b></div>
      </div>
      <div className="qa-card">
        <div className="qa-row"><span>إجمالي ما لي</span><b>{iqd(sum("receivable", "original_amount"))}</b></div>
        <div className="qa-row"><span>المحصل</span><b>{iqd(sum("receivable", "paid_amount"))}</b></div>
        <div className="qa-row"><span>المتبقي لي</span><b>{iqd(sum("receivable", "remaining_amount"))}</b></div>
      </div>

      <AddDebtForm />

      {rows.length === 0 && <div className="qa-note">لا توجد ديون مسجلة.</div>}
      {rows.map((r) => (
        <div className="qa-card" key={r.id}>
          <div className="qa-row">
            <div>
              <b>{r.party_name}</b>
              <div className="qs-muted">
                {r.direction === "payable" ? "عليّ" : "لي"} · {r.debt_date}
                {r.due_date ? ` · الاستحقاق ${r.due_date}` : ""}
              </div>
            </div>
            <span className="qa-badge">{STATUS[eff(r)] ?? r.status}</span>
          </div>
          <div className="qa-row"><span>الأصل</span><span>{iqd(r.original_amount)}</span></div>
          <div className="qa-row"><span>المدفوع</span><span>{iqd(r.paid_amount)}</span></div>
          <div className="qa-row"><span>المتبقي</span><b>{iqd(r.remaining_amount)}</b></div>
          {r.status !== "paid" && r.status !== "cancelled" && (
            <PayForm debtId={r.id} remaining={Number(r.remaining_amount)} />
          )}
        </div>
      ))}
    </section>
  );
}
