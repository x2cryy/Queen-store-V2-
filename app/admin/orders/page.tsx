import Link from "next/link";
import { ChevronLeft, ListChecks, Radio } from "lucide-react";
import { requireAnyPermission } from "../../../lib/admin/access";
import { createClient } from "../../../lib/supabase/server";
import { formatCount } from "../../../lib/admin/format";
import { PageHead } from "../_components/ui";

export const dynamic = "force-dynamic";

export default async function OrdersHome() {
  await requireAnyPermission(["orders"]);
  const supabase = await createClient();
  let counts: Record<string, number> = {};
  try {
    const r = await supabase.rpc("admin_order_counts");
    if (!r.error) counts = (r.data ?? {}) as Record<string, number>;
  } catch {}
  const n = (k: string) => Number(counts[k]) || 0;
  const total = Object.values(counts).reduce((a, v) => a + (Number(v) || 0), 0);

  const options = [
    {
      href: "/admin/orders/live",
      title: "الطلبات المباشرة",
      desc: "لوحة حية للطلبات الجديدة مع صوت تنبيه عند وصول طلب.",
      Icon: Radio,
      badge: formatCount(n("new")) + " جديد",
      hint: "قيد التجهيز: " + formatCount(n("preparing")) + " - جاهز: " + formatCount(n("ready")),
    },
    {
      href: "/admin/orders/manage",
      title: "إدارة الطلبات",
      desc: "كل الطلبات مع الفلاتر والحالات والبحث وتفاصيل كل طلب.",
      Icon: ListChecks,
      badge: formatCount(total) + " طلب",
      hint: "تسليم: " + formatCount(n("delivered")) + " - ملغي: " + formatCount(n("cancelled")),
    },
  ];

  return (
    <section>
      <PageHead title="الطلبات" desc="اختر طريقة العمل." />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
        {options.map(({ href, title, desc, Icon, badge, hint }) => (
          <Link
            key={href}
            href={href}
            style={{
              display: "grid", gap: 10, padding: 18, borderRadius: 16, minWidth: 0,
              border: "1px solid var(--c-line, #ECE6DA)", background: "var(--c-surface, #fff)",
              color: "var(--c-text, #17140F)", textDecoration: "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ display: "grid", placeItems: "center", width: 44, height: 44, borderRadius: 12, background: "rgba(184,155,106,.16)", flexShrink: 0 }}>
                <Icon size={22} />
              </span>
              <strong style={{ fontSize: 18, flex: 1 }}>{title}</strong>
              <ChevronLeft size={18} />
            </div>
            <div style={{ color: "var(--c-muted, #6B6458)", lineHeight: 1.7 }}>{desc}</div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <span className="ds-btn ds-btn-gold" style={{ pointerEvents: "none" }}>{badge}</span>
              <span style={{ fontSize: 12, color: "var(--c-muted2, #8A8372)" }}>{hint}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
