import { requireAnyPermission } from "../../../../lib/admin/access";
import { listStoreDebts } from "../../../../lib/finance/queries";
import { createClient } from "../../../../lib/supabase/server";
import { iqd } from "../../../../lib/finance/types";
import { AddStoreDebtForm, PayStoreForm } from "./Forms";

const STATUS: Record<string, string> = {
  open: "غير مدفوع",
  partial: "مدفوع جزئياً",
  paid: "مدفوع بالكامل",
  cancelled: "ملغي",
  late: "متأخر",
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; s?: string }>;
}) {
  await requireAnyPermission(["store_debts"]);
  const { q = "", s = "" } = await searchParams;
  const { rows, error } = await listStoreDebts();

  const sb = await createClient();
  const { data: customers } = await sb
    .from("customers")
    .select("id, full_name, phone")
    .order("full_name");

  const today = new Date().toISOString().slice(0, 10);
  type Row = (typeof rows)[number];
  const eff = (r: Row) =>
    r.due_date && r.due_date < today && (r.status === "open" || r.status === "partial")
      ? "late"
      : r.status;

  const live = rows.filter((r) => r.status !== "cancelled");
  const total = live.reduce((a, r) => a + Number(r.original_amount), 0);
  const paid = live.reduce((a, r) => a + Number(r.paid_amount), 0);
  const left = live.reduce((a, r) => a + Number(r.remaining_amount), 0);
  const lateRows = live.filter((r) => eff(r) === "late");
  const late = lateRows.reduce((a, r) => a + Number(r.remaining_amount), 0);

  const byCustomer = new Map<string, { name: string; left: number }>();
  for (const r of live) {
    const rem = Number(r.remaining_amount);
    if (rem <= 0) continue;
    const key = r.customer_id ?? r.party_name;
    const cur = byCustomer.get(key) ?? { name: r.party_name, left: 0 };
    cur.left += rem;
    byCustomer.set(key, cur);
  }

  const shown = rows.filter(
    (r) =>
      (!q || r.party_name.includes(q)) && (!s || eff(r) === s),
  );

  return (
    <section>
      <h1 className="qs-h1">ديون المتجر</h1>
      <p className="qs-muted">
        المبالغ المستحقة للمتجر على الزبائن. المبيعات الآجلة لا تُحسب أموالاً محصلة.
      </p>
      {error && <div className="qa-note qa-err">تعذر تحميل البيانات</div>}

      <div className="qa-card">
        <div className="qa-row"><span>إجمالي المستحق للمتجر</span><b>{iqd(total)}</b></div>
        <div className="qa-row"><span>المحصل فعلياً</span><b>{iqd(paid)}</b></div>
        <div className="qa-row"><span>الرصيد المتبقي</span><b>{iqd(left)}</b></div>
        <div className="qa-row"><span>المتأخر ({lateRows.length})</span><b>{iqd(late)}</b></div>
      </div>

      <div className="qa-card">
        <b>زبائن لديهم أرصدة مستحقة</b>
        {byCustomer.size === 0 && <div className="qs-muted">لا توجد أرصدة.</div>}
        {[...byCustomer.values()]
          .sort((a, b) => b.left - a.left)
          .map((c) => (
            <div className="qa-row" key={c.name}>
              <span>{c.name}</span>
              <b>{iqd(c.left)}</b>
            </div>
          ))}
      </div>

      <AddStoreDebtForm customers={customers ?? []} />

      <form className="qa-form" method="get">
        <input className="qa-input" name="q" defaultValue={q} placeholder="بحث باسم الزبون" />
        <select className="qa-input" name="s" defaultValue={s}>
          <option value="">كل الحالات</option>
          {Object.entries(STATUS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <button className="qa-btn">تطبيق</button>
      </form>

      {shown.length === 0 && <div className="qa-note">لا توجد ديون مطابقة.</div>}
      {shown.map((r) => (
        <div className="qa-card" key={r.id}>
          <div className="qa-row">
            <div>
              <b>{r.party_name}</b>
              <div className="qs-muted">
                {r.debt_date}
                {r.due_date ? ` · الاستحقاق ${r.due_date}` : ""}
                {r.order_id ? " · مرتبط بطلب" : ""}
              </div>
            </div>
            <span className="qa-badge">{STATUS[eff(r)] ?? r.status}</span>
          </div>
          <div className="qa-row"><span>الأصل</span><span>{iqd(r.original_amount)}</span></div>
          <div className="qa-row"><span>المحصل</span><span>{iqd(r.paid_amount)}</span></div>
          <div className="qa-row"><span>المتبقي</span><b>{iqd(r.remaining_amount)}</b></div>
          {r.status !== "paid" && r.status !== "cancelled" && (
            <PayStoreForm debtId={r.id} remaining={Number(r.remaining_amount)} />
          )}
        </div>
      ))}
    </section>
  );
}
