import Link from "next/link";
import { Receipt } from "lucide-react";
import type { Order } from "../_data/mock";
import { PAY_META, STATUS_META, itemCount, orderTotals } from "../_lib/orders";
import { fmtMoney, orderTime } from "../_lib/utils";

export default function RecentOrders({
  orders,
  total,
  selectedId,
  onOpen,
}: {
  orders: Order[];
  total: number;
  selectedId: number | null;
  onOpen: (id: number) => void;
}) {
  const list = orders.slice(0, 5);
  return (
    <section className="hp-card">
      <div className="hp-card-head">
        <h2 className="hp-h2">آخر الطلبات</h2>
        <Link className="hp-link" href="/admin/orders">
          عرض جميع الطلبات
        </Link>
      </div>

      {list.length === 0 ? (
        <div className="hp-empty">
          <Receipt size={28} aria-hidden />
          <p>لا توجد طلبات حتى الآن.</p>
        </div>
      ) : (
        <>
          <ul className="hp-orders">
            {list.map((o) => {
              const st = STATUS_META[o.status];
              const py = PAY_META[o.pay];
              return (
                <li key={o.id}>
                  <button
                    type="button"
                    id={`hp-order-${o.id}`}
                    className="hp-order"
                    aria-current={selectedId === o.id ? "true" : undefined}
                    aria-label={`عرض تفاصيل الطلب رقم ${o.id}`}
                    onClick={() => onOpen(o.id)}
                  >
                    <span className="hp-order-main">
                      <span className="hp-order-id">
                        طلب رقم <bdi dir="ltr">{o.id}</bdi>
                      </span>
                      <span className="hp-order-cust">{o.customer}</span>
                      <span className="hp-order-sub">
                        {orderTime(o.createdAt)} · {itemCount(o)} قطعة
                      </span>
                    </span>
                    <span className="hp-order-side">
                      <span className="hp-order-total">{fmtMoney(orderTotals(o).total)}</span>
                    </span>
                    <span className="hp-order-pills">
                      <span className="hp-pill hp-tone" data-tone={st.tone}>
                        {st.label}
                      </span>
                      <span className="hp-pill hp-tone" data-tone={py.tone}>
                        {py.label}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="hp-note">
            عرض {list.length} من {total} طلبات. عدد القطع هو مجموع كميات المنتجات في الطلب.
          </p>
        </>
      )}
    </section>
  );
}
