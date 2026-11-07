"use client";

import { useActionState, useEffect, useRef } from "react";
import { adjustStock, type AdjustState } from "../actions";

export function AdjustForm({
  products, selected,
}: {
  products: { id: string; name: string; quantity: number }[];
  selected?: string;
}) {
  const [state, action, pending] = useActionState<AdjustState, FormData>(adjustStock, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state.n, state.ok]);
  return (
    <form action={action} ref={ref} id="adjust">
      <div className="ds-form">
        <div>
          <label className="ds-label" htmlFor="product_id">المنتج</label>
          <select className="ds-select" id="product_id" name="product_id" defaultValue={selected ?? ""} required>
            <option value="" disabled>اختر المنتج</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name} ({p.quantity})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="ds-label" htmlFor="kind">نوع الحركة</label>
          <select className="ds-select" id="kind" name="kind" defaultValue="stock_in">
            <option value="stock_in">إدخال بضاعة (+)</option>
            <option value="return">مرتجع (+)</option>
            <option value="damage">تالف (-)</option>
            <option value="adj_plus">تسوية زيادة (+)</option>
            <option value="adj_minus">تسوية نقص (-)</option>
          </select>
        </div>
        <div>
          <label className="ds-label" htmlFor="qty">الكمية</label>
          <input className="ds-input" id="qty" name="qty" type="number" min={1} inputMode="numeric" required />
        </div>
        <div>
          <label className="ds-label" htmlFor="reason">السبب</label>
          <input className="ds-input" id="reason" name="reason" required />
        </div>
      </div>
      {state.error ? <p role="alert" style={{ color: "#B91C1C", marginTop: 12, fontWeight: 600 }}>{state.error}</p> : null}
      {state.ok ? <p role="status" style={{ color: "#15803D", marginTop: 12, fontWeight: 600 }}>{state.ok}</p> : null}
      <div style={{ marginTop: 16 }}>
        <button className="ds-btn ds-btn-gold" type="submit" disabled={pending}>
          {pending ? "جارٍ التسجيل..." : "تسجيل الحركة"}
        </button>
      </div>
    </form>
  );
}
