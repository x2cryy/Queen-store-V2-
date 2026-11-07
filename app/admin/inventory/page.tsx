import Link from "next/link";
import { requireAnyPermission } from "../../../lib/admin/access";
import { createClient } from "../../../lib/supabase/server";
import { fmtIQD, fmtNum, fmtDate } from "../../../lib/admin/fmt";
import { PageHead, KpiGrid, Panel, Badge, Empty } from "../_components/ui";
import { AdjustForm } from "./_components/AdjustForm";

type P = { id: string; name: string; quantity: number; low_stock_threshold: number; price: number; barcode: string | null };
type M = {
  id: string; product_id: string; change: number; movement_type: string;
  quantity_before: number; quantity_after: number; reason: string | null; created_at: string;
};

const LABELS: Record<string, string> = {
  stock_in: "إدخال بضاعة", sale: "بيع", return: "مرتجع",
  manual_adjustment: "تسوية يدوية", damage: "تالف", stocktake: "جرد",
};
const isOut = (p: P) => p.quantity <= 0;
const isLow = (p: P) => p.quantity > 0 && p.quantity <= p.low_stock_threshold;

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; s?: string; p?: string }>;
}) {
  await requireAnyPermission(["inventory"]);
  const sp = await searchParams;
  const sb = await createClient();

  const [pr, mv] = await Promise.all([
    sb.from("products")
      .select("id,name,quantity,low_stock_threshold,price,barcode")
      .order("quantity", { ascending: true })
      .range(0, 4999),
    sb.from("inventory_movements")
      .select("id,product_id,change,movement_type,quantity_before,quantity_after,reason,created_at")
      .order("created_at", { ascending: false })
      .limit(15),
  ]);

  if (pr.error) {
    return (
      <section>
        <PageHead title="المخزون" />
        <Panel><Empty>تعذّر تحميل المخزون. حدّث الصفحة وحاول مجدداً.</Empty></Panel>
      </section>
    );
  }

  const all = (pr.data ?? []) as P[];
  const moves = (mv.data ?? []) as M[];
  const name = new Map(all.map((p) => [p.id, p.name]));

  const units = all.reduce((a, p) => a + p.quantity, 0);
  const value = all.reduce((a, p) => a + p.quantity * p.price, 0);
  const low = all.filter(isLow).length;
  const out = all.filter(isOut).length;

  const q = (sp.q ?? "").trim().toLowerCase();
  let rows = all;
  if (q) rows = rows.filter((p) => p.name.toLowerCase().includes(q) || (p.barcode ?? "").toLowerCase().includes(q));
  if (sp.s === "low") rows = rows.filter(isLow);
  if (sp.s === "out") rows = rows.filter(isOut);
  if (sp.s === "ok") rows = rows.filter((p) => !isLow(p) && !isOut(p));
  const shown = rows.slice(0, 100);

  const byName = [...all].sort((a, b) => a.name.localeCompare(b.name, "ar")).slice(0, 1000);

  return (
    <section>
      <PageHead title="المخزون" desc="الكميات وحركات المخزون. كل تغيير في الكمية يُسجَّل في السجل." />
      <KpiGrid
        items={[
          { label: "إجمالي القطع", value: fmtNum(units) },
          { label: "قيمة المخزون", value: fmtIQD(value), hint: "بسعر البيع" },
          { label: "مخزون منخفض", value: fmtNum(low), tone: low ? "warn" : undefined },
          { label: "نافد", value: fmtNum(out), tone: out ? "bad" : undefined },
        ]}
      />

      <Panel title="تسوية المخزون">
        {all.length === 0 ? <Empty>أضف منتجات أولاً.</Empty> : <AdjustForm products={byName} selected={sp.p} />}
      </Panel>

      <Panel title="كميات المنتجات">
        <form method="get" className="ds-filters">
          <input className="ds-input" style={{ flex: "2 1 200px" }} name="q" defaultValue={sp.q ?? ""} placeholder="بحث بالاسم أو الباركود" />
          <select className="ds-select" style={{ flex: "1 1 140px" }} name="s" defaultValue={sp.s ?? ""}>
            <option value="">كل الحالات</option>
            <option value="ok">متوفر</option>
            <option value="low">منخفض</option>
            <option value="out">نافد</option>
          </select>
          <button className="ds-btn ds-btn-gold" type="submit">تطبيق</button>
        </form>
        {shown.length === 0 ? (
          <Empty>{all.length === 0 ? "لا توجد منتجات بعد." : "لا توجد نتائج مطابقة."}</Empty>
        ) : (
          <table className="ds-table">
            <thead>
              <tr><th>المنتج</th><th>الكمية</th><th>حد التنبيه</th><th>الحالة</th><th></th></tr>
            </thead>
            <tbody>
              {shown.map((p) => (
                <tr key={p.id}>
                  <td data-label="المنتج"><strong>{p.name}</strong></td>
                  <td data-label="الكمية">{fmtNum(p.quantity)}</td>
                  <td data-label="حد التنبيه">{fmtNum(p.low_stock_threshold)}</td>
                  <td data-label="الحالة">
                    {isOut(p) ? <Badge tone="bad">نافد</Badge> : isLow(p) ? <Badge tone="warn">منخفض</Badge> : <Badge tone="good">متوفر</Badge>}
                  </td>
                  <td><Link className="ds-btn" href={`/admin/inventory?p=${p.id}#adjust`}>تسوية</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {rows.length > 100 ? <p className="ds-desc">يعرض أول 100 منتج. استخدم البحث لتضييق النتائج.</p> : null}
      </Panel>

      <Panel title="آخر الحركات">
        {moves.length === 0 ? (
          <Empty>لا توجد حركات مخزون بعد.</Empty>
        ) : (
          <table className="ds-table">
            <thead>
              <tr><th>المنتج</th><th>النوع</th><th>التغيير</th><th>قبل ← بعد</th><th>السبب</th><th>التاريخ</th></tr>
            </thead>
            <tbody>
              {moves.map((m) => (
                <tr key={m.id}>
                  <td data-label="المنتج">{name.get(m.product_id) ?? "-"}</td>
                  <td data-label="النوع">{LABELS[m.movement_type] ?? m.movement_type}</td>
                  <td data-label="التغيير">
                    <Badge tone={m.change > 0 ? "good" : "bad"}>{m.change > 0 ? `+${fmtNum(m.change)}` : fmtNum(m.change)}</Badge>
                  </td>
                  <td data-label="قبل ← بعد">{fmtNum(m.quantity_before)} ← {fmtNum(m.quantity_after)}</td>
                  <td data-label="السبب">{m.reason ?? "-"}</td>
                  <td data-label="التاريخ">{fmtDate(m.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </section>
  );
}
