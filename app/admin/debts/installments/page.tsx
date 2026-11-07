import { requireAnyPermission } from "../../../../lib/admin/access";
import { listInstallments } from "../../../../lib/finance/queries";
import { createClient } from "../../../../lib/supabase/server";
import { iqd } from "../../../../lib/finance/types";
import { listPayments } from "../../../../lib/finance/payments";
import { ReverseForm } from "../payments/ReverseForm";
import { InstTabs } from "./InstTabs";
import { CircleCheck, Hourglass, TriangleAlert, Wallet } from "lucide-react";
import { CreatePlanForm, PayInstForm, RescheduleForm, type Sch } from "./Forms";

type Row = Sch & { installment_id: string };
const PLAN: Record<string, string> = { active: "نشطة", completed: "مكتملة", cancelled: "ملغية" };
const ST: Record<string, string> = { upcoming: "قادم", due: "مستحق", partial: "مدفوع جزئياً", paid: "مدفوع بالكامل", late: "متأخر" };
const FREQ: Record<string, string> = { weekly: "أسبوعي", biweekly: "كل أسبوعين", monthly: "شهري" };

const PMETHOD: Record<string, string> = { cash: "نقدي", transfer: "تحويل", qi_card: "Qi Card", other: "أخرى" };

export default async function Page({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  await requireAnyPermission(["installments"]);
  const { rows, error } = await listInstallments();
  const sb = await createClient();
  const { data: customers } = await sb.from("customers").select("id, full_name, phone").order("full_name");
  const ids = rows.map((r) => r.id);
  const { data: sch } = ids.length
    ? await sb.from("installment_schedule").select("id, installment_id, seq, due_date, amount_due, amount_paid").in("installment_id", ids).order("seq")
    : { data: [] as Row[] };
  const all = (sch ?? []) as Row[];
  const today = new Date().toISOString().slice(0, 10);
  const st = (r: Row) =>
    Number(r.amount_paid) >= Number(r.amount_due) ? "paid"
    : r.due_date < today ? "late"
    : r.due_date === today ? "due"
    : Number(r.amount_paid) > 0 ? "partial" : "upcoming";
  const lateRows = all.filter((r) => st(r) === "late");
  const active = rows.filter((r) => r.status === "active");
  const { tab: tabParam } = await searchParams;
  const tab = tabParam === "payments" ? "payments" : "plans";
  const nonCancelled = rows.filter((r) => r.status !== "cancelled");
  const totalAll = nonCancelled.reduce((a, r) => a + Number(r.total_amount), 0);
  const paidAll = nonCancelled.reduce((a, r) => a + Number(r.paid_amount), 0);
  const remainActive = active.reduce((a, r) => a + Number(r.remaining_amount), 0);
  const lateSum = lateRows.reduce((a, r) => a + Number(r.amount_due) - Number(r.amount_paid), 0);
  const pays = (await listPayments()).filter((p) => p.kind === "installment");
  const paysTotal = pays.filter((p) => !p.reversed_at).reduce((a, p) => a + p.amount, 0);
  const paymentsView = (
    <div>
      <div className="qa-stats">
        <div className="qa-stat">
          <Wallet size={18} />
          <span>إجمالي الدفعات الفعّالة</span>
          <b>{iqd(paysTotal)}</b>
        </div>
      </div>
      {pays.length === 0 && <div className="qa-note">لا توجد دفعات.</div>}
      {pays.map((p) => (
        <div className="qa-card" key={p.id}>
          <div className="qa-row">
            <div>
              <b>{p.party}</b>
              <div className="qa-muted">{p.label} · {p.paid_at}</div>
            </div>
            <b style={p.reversed_at ? { textDecoration: "line-through" } : undefined}>{iqd(p.amount)}</b>
          </div>
          <div className="qa-muted">{PMETHOD[p.method] ?? p.method}{p.reference ? " · " + p.reference : ""}</div>
          {p.reversed_at ? (
            <div className="qa-note qa-err">ملغاة: {p.reversal_reason}</div>
          ) : (
            <ReverseForm kind={p.kind} id={p.id} />
          )}
        </div>
      ))}
    </div>
  );
  return (
    <section>
      <h1 className="qs-h1">الأقساط</h1>
      <p className="qs-muted">خطط أقساط الزبائن، منفصلة عن الديون الشخصية.</p>
      {error && <div className="qa-note qa-err">تعذر تحميل البيانات</div>}
      <div className="qa-stats">
        <div className="qa-stat">
          <Wallet size={18} />
          <span>إجمالي الأقساط</span>
          <b>{iqd(totalAll)}</b>
        </div>
        <div className="qa-stat">
          <CircleCheck size={18} />
          <span>المدفوع</span>
          <b>{iqd(paidAll)}</b>
        </div>
        <div className="qa-stat">
          <Hourglass size={18} />
          <span>المتبقي</span>
          <b>{iqd(remainActive)}</b>
        </div>
        <div className="qa-stat" data-tone={lateRows.length ? "danger" : undefined}>
          <TriangleAlert size={18} />
          <span>متأخر ({lateRows.length})</span>
          <b>{iqd(lateSum)}</b>
        </div>
      </div>
      <InstTabs initial={tab} plansCount={rows.length} paymentsCount={pays.length} payments={paymentsView}>
      <CreatePlanForm customers={customers ?? []} />
      {rows.length === 0 && <div className="qa-note">لا توجد خطط أقساط.</div>}
      {rows.map((p) => {
        const mine = all.filter((r) => r.installment_id === p.id);
        return (
          <div className="qa-card" key={p.id}>
            <div className="qa-row">
              <div>
                <b>{p.title}</b>
                <div className="qs-muted">{p.party_name} · {FREQ[p.frequency] ?? p.frequency} · {p.installments_count} قسط</div>
              </div>
              <span className="qa-badge">{PLAN[p.status] ?? p.status}</span>
            </div>
            <div className="qa-row"><span>الإجمالي</span><span>{iqd(p.total_amount)}</span></div>
            <div className="qa-row"><span>الدفعة المقدمة</span><span>{iqd(p.down_payment)}</span></div>
            <div className="qa-row"><span>المدفوع</span><span>{iqd(p.paid_amount)}</span></div>
            <div className="qa-row"><span>المتبقي</span><b>{iqd(p.remaining_amount)}</b></div>
            <details className="qa-details">
              <summary>جدول الاستحقاق</summary>
              {mine.map((r) => (
                <div className="qa-row" key={r.id}>
                  <span>قسط {r.seq} · {r.due_date}</span>
                  <span>{iqd(r.amount_paid)} / {iqd(r.amount_due)} · <span className="qa-badge">{ST[st(r)]}</span></span>
                </div>
              ))}
            </details>
            {p.status === "active" && <PayInstForm planId={p.id} rows={mine} />}
            {p.status === "active" && <RescheduleForm rows={mine} />}
          </div>
        );
      })}
      </InstTabs>
    </section>
  );
}
