import Link from "next/link";
import { Minus, Package, Receipt, ShoppingBag, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Summary } from "../_data/mock";
import { fmtNum } from "../_lib/utils";

function Delta({ cur, prev, down }: { cur: number; prev: number | null; down: "bad" | "neutral" }) {
  if (!prev) {
    return (
      <span className="hp-delta" data-tone="na">
        <Minus size={14} aria-hidden /> لا تتوفر مقارنة
      </span>
    );
  }
  const d = ((cur - prev) / Math.abs(prev)) * 100;
  if (Math.abs(d) < 0.05) {
    return (
      <span className="hp-delta" data-tone="neutral">
        <Minus size={14} aria-hidden /> دون تغيير عن أمس
      </span>
    );
  }
  const up = d > 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span className="hp-delta" data-tone={up ? "good" : down}>
      <Icon size={14} aria-hidden />
      <bdi dir="ltr">
        {up ? "+" : "−"}
        {Math.abs(d).toFixed(1)}%
      </bdi>
      <span>عن أمس</span>
    </span>
  );
}

type CardDef = {
  key: string;
  title: string;
  icon: LucideIcon;
  value: number;
  money: boolean;
  unit: string;
  note: string;
  prev?: number | null;
  down?: "bad" | "neutral";
  href: string;
  cta: string;
};

export default function SummaryCards({ summary: s }: { summary: Summary }) {
  const cards: CardDef[] = [
    {
      key: "new",
      title: "الطلبات الجديدة اليوم",
      icon: Receipt,
      value: s.newToday,
      money: false,
      unit: "طلب",
      note: "طلبات أُنشئت اليوم",
      prev: s.newYesterday,
      down: "neutral",
      href: "/admin/orders",
      cta: "عرض الطلبات",
    },
    {
      key: "processing",
      title: "الطلبات قيد التجهيز",
      icon: Package,
      value: s.processing,
      money: false,
      unit: "طلب",
      note: "الطلبات الحالية في هذه الحالة، وقد تكون من أيام سابقة",
      href: "/admin/orders/live",
      cta: "الطلبات المباشرة",
    },
    {
      key: "sales",
      title: "مبيعات اليوم",
      icon: ShoppingBag,
      value: s.salesToday,
      money: true,
      unit: "د.ع",
      note: "حسب تعريف المبيعات المعتمد في التقارير",
      prev: s.salesYesterday,
      down: "bad",
      href: "/admin/reports",
      cta: "فتح التقارير",
    },
    {
      key: "collected",
      title: "المبالغ المحصلة اليوم",
      icon: Wallet,
      value: s.collectedToday,
      money: true,
      unit: "د.ع",
      note: "مبالغ مسددة فعلًا، وليست كل مبالغ الطلبات",
      href: "/admin/reports",
      cta: "فتح التقارير",
    },
  ];

  return (
    <div className="hp-kpis">
      {cards.map((c) => (
        <article key={c.key} className="hp-card">
          <div className="hp-kpi-top">
            <span className="hp-kpi-ico">
              <c.icon size={18} aria-hidden />
            </span>
            {c.title}
          </div>
          <div className="hp-kpi-val">
            <span className="hp-money">
              <bdi dir="ltr">{fmtNum(c.value)}</bdi>
              <span className="hp-unit">{c.unit}</span>
            </span>
          </div>
          {c.prev !== undefined && <Delta cur={c.value} prev={c.prev} down={c.down ?? "neutral"} />}
          <p className="hp-note">{c.note}</p>
          <Link className="hp-link hp-kpi-link" href={c.href}>
            {c.cta}
          </Link>
        </article>
      ))}
    </div>
  );
}
