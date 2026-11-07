"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { Order } from "../_data/mock";
import { PAY_META, STATUS_META, fullDateTime, orderTotals } from "../_lib/orders";
import { fmtMoney } from "../_lib/utils";

export default function OrderDrawer({ order, onClose }: { order: Order | null; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const open = !!order;

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [open, onClose]);

  const t = order ? orderTotals(order) : null;

  return (
    <AnimatePresence>
      {order && t && (
        <motion.div key="scrim" className="hp-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
      )}
      {order && t && (
        <motion.aside
          key="drawer"
          className="hp-drawer"
          role="dialog"
          aria-modal="true"
          aria-label={`تفاصيل الطلب رقم ${order.id}`}
          initial={{ x: "-100%" }}
          animate={{ x: 0 }}
          exit={{ x: "-100%" }}
          transition={{ type: "tween", duration: 0.22 }}
        >
          <div className="hp-drawer-head">
            <div>
              <h2 className="hp-h2">
                طلب رقم <bdi dir="ltr">{order.id}</bdi>
              </h2>
              <p className="hp-note" style={{ margin: "4px 0 0" }}>
                {fullDateTime(order.createdAt)}
              </p>
            </div>
            <button ref={closeRef} type="button" className="hp-btn" onClick={onClose} aria-label="إغلاق">
              <X size={18} aria-hidden />
            </button>
          </div>

          <div className="hp-drawer-body">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              <span className="hp-pill hp-tone" data-tone={STATUS_META[order.status].tone}>
                {STATUS_META[order.status].label}
              </span>
              <span className="hp-pill hp-tone" data-tone={PAY_META[order.pay].tone}>
                {PAY_META[order.pay].label}
              </span>
            </div>

            <dl className="hp-kv">
              <dt>العميل</dt>
              <dd>{order.customer}</dd>
              <dt>رقم الهاتف</dt>
              <dd>{order.phone ? <bdi dir="ltr">{order.phone}</bdi> : "غير متوفر"}</dd>
              <dt>المنطقة</dt>
              <dd>{order.area ?? "غير متوفرة"}</dd>
              <dt>العنوان</dt>
              <dd>{order.address ?? "غير متوفر"}</dd>
            </dl>

            <div>
              <h2 className="hp-h2" style={{ marginBottom: 8 }}>
                ملاحظات العميل
              </h2>
              {order.notes ? <p className="hp-notes">{order.notes}</p> : <p className="hp-note">لا توجد ملاحظات.</p>}
            </div>

            <div>
              <h2 className="hp-h2" style={{ marginBottom: 4 }}>
                المنتجات
              </h2>
              <ul>
                {order.items.map((it, i) => (
                  <li key={`${it.name}-${i}`} className="hp-item">
                    <span className="hp-item-n">{i + 1}</span>
                    <span className="hp-item-name">{it.name}</span>
                    <span className="hp-item-total">{fmtMoney(it.qty * it.unit)}</span>
                    <span className="hp-item-sub">
                      {it.option ? `الخيار: ${it.option} · ` : ""}الكمية: {it.qty} × {fmtMoney(it.unit)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="hp-sum">
                <span>المجموع</span>
                <span>{fmtMoney(t.subtotal)}</span>
              </div>
              {t.discount > 0 && (
                <div className="hp-sum">
                  <span>الخصم</span>
                  <span>− {fmtMoney(t.discount)}</span>
                </div>
              )}
              {order.fees.map((f) => (
                <div key={f.label} className="hp-sum">
                  <span>{f.label}</span>
                  <span>{fmtMoney(f.amount)}</span>
                </div>
              ))}
              <div className="hp-sum hp-sum--total">
                <span>الإجمالي النهائي</span>
                <span>{fmtMoney(t.total)}</span>
              </div>
            </div>

            <p className="hp-note" data-warn="true">
              الأزرار أدناه معطلة لأن هذه الطلبات تجريبية. تُفعَّل عند الربط الحقيقي وتفتح الصفحات الموجودة في المتجر.
            </p>
          </div>

          <div className="hp-drawer-foot">
            <button type="button" className="hp-btn hp-btn--solid" disabled title="يُفعَّل عند الربط الحقيقي">
              فتح الطلب الكامل
            </button>
            {order.hasReceipt && (
              <button type="button" className="hp-btn" disabled title="يُفعَّل عند الربط الحقيقي">
                عرض الوصل
              </button>
            )}
            {order.hasChat && (
              <button type="button" className="hp-btn" disabled title="يُفعَّل عند الربط الحقيقي">
                فتح المحادثة
              </button>
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
