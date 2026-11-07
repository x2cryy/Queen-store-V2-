"use client";

import { startTransition, useActionState, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, ChevronLeft, ChevronRight, Info } from "lucide-react";
import { saveProduct, type FormState } from "../actions";
import { fmtIQD } from "../../../../lib/admin/fmt";

export type ProductInit = {
  id: string; name: string; category_id: string | null; brand: string | null;
  description: string | null; barcode: string | null; price: number; quantity: number;
  low_stock_threshold: number; status: string; is_featured: boolean; is_new: boolean;
};

const STEPS = [
  { title: "المعلومات الأساسية", hint: "اسم المنتج وتصنيفه ووصفه." },
  { title: "الصور", hint: "صور المنتج والصورة الرئيسية." },
  { title: "السعر والتكلفة", hint: "سعر البيع وتكلفة الشراء لحساب الربح." },
  { title: "المخزون", hint: "الكمية الحالية وحد التنبيه." },
  { title: "الخيارات", hint: "الألوان والمقاسات وغيرها." },
  { title: "الظهور في المتجر", hint: "حالة المنتج وعلاماته المميزة." },
];

function Note({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 10, padding: 14, border: "1px dashed var(--c-line-strong, #DDD5C5)", borderRadius: 12, color: "var(--c-muted, #6B6458)", lineHeight: 1.8, fontSize: 14 }}>
      <Info size={18} style={{ flexShrink: 0, marginTop: 4 }} />
      <div>{children}</div>
    </div>
  );
}

export function ProductForm({
  categories, product, cost,
}: {
  categories: { id: string; name: string }[];
  product?: ProductInit;
  cost?: number | null;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveProduct, {});
  const p = product;
  const formRef = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [live, setLive] = useState<{ price: number; cost: number | null }>({ price: p?.price ?? 0, cost: cost ?? null });
  const last = STEPS.length - 1;

  const val = (name: string) => {
    if (!formRef.current) return "";
    return String(new FormData(formRef.current).get(name) ?? "").trim();
  };
  const toNum = (s: string) => Number(s.replace(/,/g, ""));
  const isNum = (s: string) => s !== "" && Number.isFinite(toNum(s)) && toNum(s) >= 0;

  function check(i: number): string | null {
    if (i === 0 && !val("name")) return "اسم المنتج مطلوب.";
    if (i === 2) {
      if (!isNum(val("price"))) return "أدخل سعراً صحيحاً (صفر أو أكثر).";
      const c = val("cost_price");
      if (c !== "" && !isNum(c)) return "سعر التكلفة غير صحيح.";
    }
    if (i === 3) {
      if (!isNum(val("quantity"))) return "أدخل كمية صحيحة.";
      if (!isNum(val("low_stock_threshold"))) return "أدخل حد تنبيه صحيحاً.";
    }
    return null;
  }

  function go(to: number) {
    if (to > step) {
      for (let i = step; i < to; i++) {
        const m = check(i);
        if (m) { setStep(i); setErr(m); return; }
      }
    }
    setErr(null);
    setStep(to);
  }

  function onChange() {
    const price = toNum(val("price"));
    const c = val("cost_price");
    setLive({
      price: Number.isFinite(price) ? price : 0,
      cost: c === "" || !Number.isFinite(toNum(c)) ? null : toNum(c),
    });
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    for (let i = 0; i <= last; i++) {
      const m = check(i);
      if (m) { setStep(i); setErr(m); return; }
    }
    if (step !== last) { go(step + 1); return; }
    setErr(null);
    const fd = new FormData(e.currentTarget);
    startTransition(() => action(fd));
  }

  const pane = (i: number, node: ReactNode) => (
    <motion.div
      key={i}
      initial={false}
      animate={i === step ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
      transition={{ duration: 0.18 }}
      style={{ display: i === step ? "block" : "none" }}
    >
      {node}
    </motion.div>
  );

  const profit = live.cost !== null ? live.price - live.cost : null;
  const margin = profit !== null && live.price > 0 ? Math.round((profit / live.price) * 1000) / 10 : null;
  const shownError = err ?? state.error ?? null;

  return (
    <form ref={formRef} onSubmit={onSubmit} onChange={onChange}>
      {p ? <input type="hidden" name="id" value={p.id} /> : null}

      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {STEPS.map((s, i) => (
          <button
            key={s.title}
            type="button"
            onClick={() => go(i)}
            aria-label={"الخطوة " + (i + 1) + ": " + s.title}
            aria-current={i === step ? "step" : undefined}
            style={{ flex: 1, height: 10, border: 0, padding: 0, borderRadius: 99, cursor: "pointer", background: i <= step ? "var(--c-gold-dark, #7D6335)" : "var(--c-line, #ECE6DA)" }}
          />
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <span style={{ display: "grid", placeItems: "center", width: 34, height: 34, borderRadius: 99, background: "var(--c-gold-dark, #7D6335)", color: "var(--c-surface, #fff)", fontWeight: 700, flexShrink: 0 }}>{step + 1}</span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700 }}>{STEPS[step].title}</div>
          <div className="ds-desc">{STEPS[step].hint}</div>
        </div>
        <span style={{ marginInlineStart: "auto", fontSize: 12, color: "var(--c-muted2, #8A8372)" }}>{step + 1} / {STEPS.length}</span>
      </div>

      {pane(0, (
        <>
          <div className="ds-form">
            <div>
              <label className="ds-label" htmlFor="name">اسم المنتج</label>
              <input className="ds-input" id="name" name="name" defaultValue={p?.name ?? ""} />
            </div>
            <div>
              <label className="ds-label" htmlFor="category_id">التصنيف</label>
              <select className="ds-select" id="category_id" name="category_id" defaultValue={p?.category_id ?? ""}>
                <option value="">بدون تصنيف</option>
                {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
              </select>
            </div>
            <div>
              <label className="ds-label" htmlFor="brand">الماركة التجارية</label>
              <input className="ds-input" id="brand" name="brand" defaultValue={p?.brand ?? ""} />
            </div>
            <div>
              <label className="ds-label" htmlFor="barcode">الباركود</label>
              <input className="ds-input" id="barcode" name="barcode" dir="ltr" defaultValue={p?.barcode ?? ""} />
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <label className="ds-label" htmlFor="description">الوصف</label>
            <textarea className="ds-input" style={{ height: 110, padding: 12 }} id="description" name="description" defaultValue={p?.description ?? ""} />
          </div>
        </>
      ))}

      {pane(1, (
        <Note>
          {p
            ? "صور المنتج تُدار من قسم «صور المنتج» أسفل هذه الصفحة: رفع متعدد، تعيين الصورة الرئيسية، والحذف."
            : "رفع الصور يتم بعد حفظ المنتج مباشرة: عند الضغط على «إضافة المنتج» ننتقل تلقائياً لصفحة المنتج لرفع الصور وإضافة الخيارات."}
        </Note>
      ))}

      {pane(2, (
        <>
          <div className="ds-form">
            <div>
              <label className="ds-label" htmlFor="price">سعر البيع (د.ع)</label>
              <input className="ds-input" id="price" name="price" type="number" min={0} inputMode="numeric" defaultValue={p?.price ?? ""} />
            </div>
            <div>
              <label className="ds-label" htmlFor="cost_price">سعر التكلفة (د.ع)</label>
              <input className="ds-input" id="cost_price" name="cost_price" type="number" min={0} inputMode="numeric" defaultValue={cost ?? ""} />
              <div className="ds-desc">اختياري، ويُستعمل لحساب الربح.</div>
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            {profit !== null ? (
              <div className="ds-kpi" data-tone={profit < 0 ? "bad" : "good"}>
                <span className="ds-kpi-label">الربح المتوقع للوحدة</span>
                <span className="ds-kpi-value">{fmtIQD(profit)}</span>
                <span className="ds-kpi-hint">{margin !== null ? "هامش " + margin + "%" : ""}</span>
              </div>
            ) : (
              <Note>أدخل سعر التكلفة لتظهر معاينة الربح هنا.</Note>
            )}
          </div>
        </>
      ))}

      {pane(3, (
        <div className="ds-form">
          <div>
            <label className="ds-label" htmlFor="quantity">الكمية</label>
            <input className="ds-input" id="quantity" name="quantity" type="number" min={0} inputMode="numeric" defaultValue={p?.quantity ?? 0} />
          </div>
          <div>
            <label className="ds-label" htmlFor="low_stock_threshold">حد تنبيه المخزون</label>
            <input className="ds-input" id="low_stock_threshold" name="low_stock_threshold" type="number" min={0} inputMode="numeric" defaultValue={p?.low_stock_threshold ?? 5} />
            <div className="ds-desc">عندما تصل الكمية لهذا الرقم أو أقل يظهر المنتج «منخفض».</div>
          </div>
        </div>
      ))}

      {pane(4, (
        <Note>
          {p
            ? "الخيارات (SKU، فرق السعر، الكمية) تُدار من قسم الخيارات أسفل هذه الصفحة."
            : "الخيارات تُضاف بعد حفظ المنتج مباشرة، من صفحة المنتج التي ننتقل لها تلقائياً."}
        </Note>
      ))}

      {pane(5, (
        <>
          <Note>
          {p ? "حالة الظهور تُدار من زر «نشر / إخفاء» أعلى الصفحة." : "يُحفظ المنتج كمسودة (مخفي). بعد إضافة الصور من صفحته تنشره بزر «نشر المنتج»."}
        </Note>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginTop: 14 }}>
            <label style={{ display: "flex", gap: 8, alignItems: "center", color: "var(--c-text, #17140F)" }}>
              <input type="checkbox" name="is_featured" defaultChecked={p?.is_featured} /> منتج مميز
            </label>
            <label style={{ display: "flex", gap: 8, alignItems: "center", color: "var(--c-text, #17140F)" }}>
              <input type="checkbox" name="is_new" defaultChecked={p?.is_new} /> وصل حديثاً
            </label>
          </div>
        </>
      ))}

      {shownError ? (
        <p role="alert" style={{ color: "var(--c-bad, #B91C1C)", marginTop: 14, fontWeight: 600 }}>{shownError}</p>
      ) : null}

      {state.ok ? <p role="status" style={{ color: "var(--c-good, #15803D)", marginTop: 14, fontWeight: 600 }}>{state.ok}</p> : null}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 20 }}>
        {step > 0 ? (
          <button type="button" className="ds-btn" onClick={() => go(step - 1)}><ChevronRight size={16} /> السابق</button>
        ) : null}
        {step < last ? (
          <button type="button" className="ds-btn ds-btn-gold" onClick={() => go(step + 1)}>التالي <ChevronLeft size={16} /></button>
        ) : (
          <button type="submit" className="ds-btn ds-btn-gold" disabled={pending}>
            <Check size={16} /> {pending ? "جارٍ الحفظ..." : p ? "حفظ التعديلات" : "حفظ كمسودة"}
          </button>
        )}
        <Link className="ds-btn" href="/admin/products">إلغاء</Link>
      </div>
    </form>
  );
}
