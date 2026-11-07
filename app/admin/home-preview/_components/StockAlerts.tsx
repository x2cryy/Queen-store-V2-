import Link from "next/link";
import { Check, Package } from "lucide-react";
import type { StockItem } from "../_data/mock";
import { fmtNum } from "../_lib/utils";

export default function StockAlerts({ items }: { items: StockItem[] }) {
  // النافد أولًا، ثم الأقل كمية
  const list = [...items]
    .sort((a, b) => (a.state === b.state ? a.qty - b.qty : a.state === "out" ? -1 : 1))
    .slice(0, 5);

  return (
    <section className="hp-card">
      <div className="hp-card-head">
        <h2 className="hp-h2">المخزون يحتاج متابعة</h2>
        <Link className="hp-link" href="/admin/inventory">
          عرض المخزون
        </Link>
      </div>
      {list.length === 0 ? (
        <p className="hp-calm">
          <Check size={18} aria-hidden /> لا توجد تنبيهات مخزون حاليًا
        </p>
      ) : (
        <ul className="hp-list">
          {list.map((s) => (
            <li key={s.id} className="hp-row">
              <span className="hp-row-ico">
                <Package size={20} aria-hidden />
              </span>
              <span className="hp-row-txt">
                <span className="hp-row-title">
                  {s.name}
                  {s.option ? ` — ${s.option}` : ""}
                </span>
                <span className="hp-row-sub">
                  المتبقي: {fmtNum(s.qty)}
                  {s.threshold !== null ? ` · حد التنبيه: ${fmtNum(s.threshold)}` : " · لا يوجد حد تنبيه محدد"}
                </span>
              </span>
              <span className="hp-row-end">
                <span className="hp-pill hp-tone" data-tone={s.state === "out" ? "red" : "amber"}>
                  {s.state === "out" ? "نافد" : "منخفض"}
                </span>
                <Link className="hp-link" href="/admin/inventory" aria-label={`فتح المخزون لمنتج ${s.name}`}>
                  فتح
                </Link>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
