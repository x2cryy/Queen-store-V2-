import Link from "next/link";
import { Phone, Search } from "lucide-react";
import { requireAnyPermission } from "../../../lib/admin/access";
import { createClient } from "../../../lib/supabase/server";
import { fmtIQD, fmtNum, fmtDate } from "../../../lib/admin/fmt";
import { PageHead, KpiGrid, Panel, Empty, Badge } from "../_components/ui";

type C = { id: string; full_name: string | null; phone: string | null; area: string | null; created_at: string };
type O = { customer_id: string | null; total: number; status: string };
type R = { customer_id: string | null; remaining_amount: number; status: string | null };

const live = (s: string) => !s.toLowerCase().includes("cancel");

const FILTERS: Record<string, string> = {
  all: "كل الزبائن",
  buyers: "اشتروا",
  none: "بدون مشتريات",
  debts: "عليهم ديون",
  inst: "عليهم أقساط",
};
const SORTS: Record<string, string> = { new: "الأحدث", spent: "الأكثر شراءً", orders: "الأكثر طلبات", name: "الاسم" };

function sumBy(rows: R[], active: (r: R) => boolean) {
  const m = new Map<string, number>();
  for (const r of rows) {
    if (!r.customer_id || !active(r)) continue;
    const left = Number(r.remaining_amount ?? 0);
    if (left <= 0) continue;
    m.set(r.customer_id, (m.get(r.customer_id) ?? 0) + left);
  }
  return m;
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; f?: string; s?: string }>;
}) {
  await requireAnyPermission(["customers"]);
  const sp = await searchParams;
  const q = (sp.q ?? "").replace(/[%,()]/g, "").trim();
  const f = sp.f && sp.f in FILTERS ? sp.f : "all";
  const s = sp.s && sp.s in SORTS ? sp.s : "new";
  const sb = await createClient();
  const since = new Date(Date.now() - 30 * 86400000).toISOString();

  let cq = sb.from("customers").select("id,full_name,phone,area,created_at").order("created_at", { ascending: false }).limit(500);
  if (q) cq = cq.or(`full_name.ilike.%${q}%,phone.ilike.%${q}%`);

  const [list, totalR, newR, ordR, debtR, instR] = await Promise.all([
    cq,
    sb.from("customers").select("id", { count: "exact", head: true }),
    sb.from("customers").select("id", { count: "exact", head: true }).gte("created_at", since),
    sb.from("orders").select("customer_id,total,status").not("customer_id", "is", null).range(0, 9999),
    sb.from("store_debts").select("customer_id,remaining_amount,status").not("customer_id", "is", null).range(0, 9999),
    sb.from("installments").select("customer_id,remaining_amount,status").not("customer_id", "is", null).range(0, 9999),
  ]);

  if (list.error || ordR.error) {
    return (
      <section>
        <PageHead title="الزبائن" />
        <Panel><Empty>تعذّر تحميل الزبائن. أعد المحاولة بعد قليل.</Empty></Panel>
      </section>
    );
  }

  const agg = new Map<string, { n: number; sum: number }>();
  for (const o of (ordR.data ?? []) as O[]) {
    if (!o.customer_id || !live(o.status)) continue;
    const a = agg.get(o.customer_id) ?? { n: 0, sum: 0 };
    a.n += 1;
    a.sum += Number(o.total ?? 0);
    agg.set(o.customer_id, a);
  }
  const debtMap = sumBy((debtR.data ?? []) as R[], (r) => r.status !== "cancelled");
  const instMap = sumBy((instR.data ?? []) as R[], (r) => r.status === "active");

  const all = (list.data ?? []) as C[];
  let rows = all.filter((c) => {
    if (f === "buyers") return agg.has(c.id);
    if (f === "none") return !agg.has(c.id);
    if (f === "debts") return debtMap.has(c.id);
    if (f === "inst") return instMap.has(c.id);
    return true;
  });
  rows = [...rows].sort((a, b) => {
    if (s === "spent") return (agg.get(b.id)?.sum ?? 0) - (agg.get(a.id)?.sum ?? 0);
    if (s === "orders") return (agg.get(b.id)?.n ?? 0) - (agg.get(a.id)?.n ?? 0);
    if (s === "name") return (a.full_name ?? "").localeCompare(b.full_name ?? "", "ar");
    return 0;
  });

  let topName = "-";
  let topSum = 0;
  for (const [id, a] of agg) {
    if (a.sum > topSum) {
      topSum = a.sum;
      topName = all.find((c) => c.id === id)?.full_name ?? "-";
    }
  }

  return (
    <section>
      <PageHead title="الزبائن" desc="قاعدة الزبائن ومشترياتهم والتزاماتهم." />
      <KpiGrid
        items={[
          { label: "إجمالي الزبائن", value: fmtNum(totalR.count ?? 0) },
          { label: "جدد خلال 30 يوماً", value: fmtNum(newR.count ?? 0), tone: (newR.count ?? 0) > 0 ? "good" : undefined },
          { label: "زبائن اشتروا", value: fmtNum(agg.size), hint: topSum ? "الأعلى: " + topName + " (" + fmtIQD(topSum) + ")" : undefined },
          { label: "عليهم ديون", value: fmtNum(debtMap.size) },
          { label: "عليهم أقساط", value: fmtNum(instMap.size) },
        ]}
      />
      <Panel title="قائمة الزبائن">
        <form method="get" className="ds-filters">
          <input className="ds-input" style={{ flex: "1 1 220px" }} name="q" defaultValue={sp.q ?? ""} placeholder="ابحث بالاسم أو رقم الهاتف" />
          <select className="ds-input" name="f" defaultValue={f} aria-label="تصفية">
            {Object.entries(FILTERS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <select className="ds-input" name="s" defaultValue={s} aria-label="ترتيب">
            {Object.entries(SORTS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <button className="ds-btn ds-btn-gold" type="submit"><Search size={16} /> تطبيق</button>
        </form>
        {rows.length === 0 ? (
          <Empty>{q || f !== "all" ? "لا توجد نتائج مطابقة." : "لا يوجد زبائن بعد."}</Empty>
        ) : (
          <table className="ds-table">
            <thead>
              <tr><th>الزبون</th><th>الهاتف</th><th>المنطقة</th><th>الطلبات</th><th>المشتريات</th><th>الالتزامات</th><th>التسجيل</th><th></th></tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const a = agg.get(c.id);
                const d = debtMap.get(c.id);
                const i = instMap.get(c.id);
                return (
                  <tr key={c.id}>
                    <td data-label="الزبون"><strong>{c.full_name ?? "بدون اسم"}</strong></td>
                    <td data-label="الهاتف"><span dir="ltr">{c.phone ?? "-"}</span></td>
                    <td data-label="المنطقة">{c.area ?? "-"}</td>
                    <td data-label="الطلبات">{fmtNum(a?.n ?? 0)}</td>
                    <td data-label="المشتريات">{fmtIQD(a?.sum ?? 0)}</td>
                    <td data-label="الالتزامات">
                      {!d && !i ? "-" : (
                        <span style={{ display: "inline-flex", gap: 6, flexWrap: "wrap" }}>
                          {d ? <Badge>دين {fmtIQD(d)}</Badge> : null}
                          {i ? <Badge>قسط {fmtIQD(i)}</Badge> : null}
                        </span>
                      )}
                    </td>
                    <td data-label="التسجيل">{fmtDate(c.created_at)}</td>
                    <td>
                      <span style={{ display: "inline-flex", gap: 6 }}>
                        {c.phone ? (
                          <a className="ds-btn" href={`tel:${c.phone}`} aria-label="اتصال"><Phone size={16} /></a>
                        ) : null}
                        <Link className="ds-btn" href={`/admin/customers/${c.id}`}>عرض</Link>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {all.length === 500 ? <p className="ds-desc">عرض أحدث 500 زبون. استخدم البحث لتضييق النتائج.</p> : null}
      </Panel>
    </section>
  );
}
