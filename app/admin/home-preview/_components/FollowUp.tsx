import Link from "next/link";
import { CalendarClock, Check, CreditCard, MessageCircle, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { FollowUp as Item } from "../_data/mock";
import { fmtNum } from "../_lib/utils";

const ICONS: Record<Item["key"], LucideIcon> = {
  messages: MessageCircle,
  qicard: CreditCard,
  store_debts: Wallet,
  store_installments: CalendarClock,
};

export default function FollowUp({ items }: { items: Item[] }) {
  const active = items.filter((i) => i.count === null || i.count > 0);
  return (
    <section className="hp-card">
      <div className="hp-card-head">
        <h2 className="hp-h2">يحتاج متابعة</h2>
      </div>
      {active.length === 0 ? (
        <p className="hp-calm">
          <Check size={18} aria-hidden /> لا توجد بنود تحتاج متابعة حاليًا
        </p>
      ) : (
        <ul className="hp-list">
          {active.map((i) => {
            const Icon = ICONS[i.key];
            return (
              <li key={i.key} className="hp-row">
                <span className="hp-row-ico">
                  <Icon size={20} aria-hidden />
                </span>
                <span className="hp-row-txt">
                  <span className="hp-row-title">{i.label}</span>
                  <span className="hp-row-sub">{i.note}</span>
                </span>
                <span className="hp-row-end">
                  {i.count === null ? (
                    <span className="hp-pill hp-tone" data-tone="gray">
                      غير معروض
                    </span>
                  ) : (
                    <>
                      <span className="hp-count hp-tone" data-tone={i.key === "messages" ? "blue" : "amber"}>
                        {fmtNum(i.count)}
                      </span>
                      <Link className="hp-link" href={i.href} aria-label={`فتح: ${i.label}`}>
                        فتح
                      </Link>
                    </>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}
      <p className="hp-note">الديون والأقساط الشخصية لا تُعرض في الرئيسية.</p>
    </section>
  );
}
