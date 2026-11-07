"use client";

import { useEffect, useMemo, useState } from "react";
import type { ProductDetail } from "../../lib/shop/product";
import { formatPrice } from "../../lib/shop/format";
import { CloseIcon } from "./icons";
import { useCart } from "./CartProvider";

export default function ProductView({ product }: { product: ProductDetail }) {
  const { options, variants, images } = product;
  const hasOptions = options.length > 0 && variants.length > 0;
  const { addItem } = useCart();

  const [sel, setSel] = useState<Record<string, string>>({});
  const [qty, setQty] = useState(1);
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const variant = useMemo(() => {
    if (!hasOptions || !options.every((o) => sel[o.id])) return null;
    return (
      variants.find(
        (v) =>
          v.valueIds.length === options.length &&
          options.every((o) => v.valueIds.includes(sel[o.id]))
      ) ?? null
    );
  }, [hasOptions, options, variants, sel]);

  // القيم التي لها متغير واحد على الأقل بمخزون
  const liveValues = useMemo(() => {
    const s = new Set<string>();
    for (const v of variants) if (v.stock > 0) v.valueIds.forEach((id) => s.add(id));
    return s;
  }, [variants]);

  useEffect(() => {
    if (!variant?.imageUrl) return;
    const i = images.findIndex((x) => x.url === variant.imageUrl);
    if (i >= 0) setActive(i);
  }, [variant, images]);

  useEffect(() => {
    if (!zoom) return;
    const n = images.length;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoom(false);
      else if (e.key === "ArrowLeft") setActive((i) => (i + 1) % n);
      else if (e.key === "ArrowRight") setActive((i) => (i - 1 + n) % n);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [zoom, images.length]);

  function pick(optId: string, valId: string) {
    setNote(null);
    setSel((prev) => {
      if (prev[optId] === valId) {
        const next = { ...prev };
        delete next[optId];
        return next;
      }
      const kept: Record<string, string> = { [optId]: valId };
      for (const o of options) {
        const cur = prev[o.id];
        if (o.id === optId || !cur) continue;
        const ids = [...Object.values(kept), cur];
        if (variants.some((x) => x.stock > 0 && ids.every((id) => x.valueIds.includes(id)))) {
          kept[o.id] = cur;
        }
      }
      return kept;
    });
  }

  const needPick = hasOptions && !variant;
  const stock = hasOptions ? (variant ? variant.stock : 0) : product.stock;
  const price = variant ? variant.price : product.price;
  const compareAt = variant ? variant.compareAt : product.compareAt;
  const discount =
    compareAt && compareAt > price ? Math.round((1 - price / compareAt) * 100) : null;
  const qtyEff = Math.min(Math.max(1, qty), Math.max(1, stock));

  let stockLabel = "متوفر";
  let stockCls = "";
  if (needPick) {
    stockLabel = product.inStock ? "اختر الخيارات لمعرفة التوفر" : "غير متوفر";
    stockCls = product.inStock ? "" : "out";
  } else if (stock < 1) {
    stockLabel = "غير متوفر";
    stockCls = "out";
  } else if (stock <= product.lowStock) {
    stockLabel = `متبقي ${stock} فقط`;
    stockCls = "low";
  }

  function add() {
    if (needPick) {
      const miss = options.filter((o) => !sel[o.id]).map((o) => o.name).join("، ");
      setNote(`اختر ${miss} أولاً`);
      return;
    }
    if (stock < 1) {
      setNote("هذا الخيار غير متوفر حالياً");
      return;
    }
    const res = addItem(
      { productId: product.id, variantId: variant?.id ?? null, qty: qtyEff },
      stock
    );
    setNote(res.message);
  }

  const cur = images[active] ?? images[0];
  const canBuy = needPick || stock > 0;

  return (
    <div className="qm-pdp">
      <div className="qm-gal">
        <div className="qm-gal-main">
          {cur ? (
            <button
              type="button"
              className="qm-gal-btn"
              onClick={() => setZoom(true)}
              aria-label="تكبير الصورة"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={cur.url} alt={cur.alt} decoding="async" />
            </button>
          ) : (
            <span className="qm-noimg qm-logo">QUEEN STORE</span>
          )}
          {discount ? <span className="qm-tag">خصم {discount}%</span> : null}
        </div>
        {images.length > 1 && (
          <div className="qm-thumbs">
            {images.map((im, i) => (
              <button
                key={im.url}
                type="button"
                className={`qm-thumb${i === active ? " on" : ""}`}
                onClick={() => setActive(i)}
                aria-label={`صورة ${i + 1}`}
                aria-current={i === active}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={im.url} alt="" loading="lazy" decoding="async" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="qm-info">
        {product.brand ? <p className="qm-brand">{product.brand}</p> : null}
        <h1>{product.name}</h1>
        <div className="qm-pdp-price">
          <strong>{formatPrice(price)}</strong>
          {compareAt && compareAt > price ? <s>{formatPrice(compareAt)}</s> : null}
        </div>
        <p className={`qm-stock ${stockCls}`}>{stockLabel}</p>
        {variant?.sku ? <p className="qm-sku">رقم المنتج: {variant.sku}</p> : null}

        {options.map((o) => {
          const chosen = o.values.find((v) => v.id === sel[o.id]);
          return (
            <fieldset className="qm-opt" key={o.id}>
              <legend>
                {o.name}
                {chosen ? `: ${chosen.label}` : ""}
              </legend>
              <div className="qm-opt-vals">
                {o.values.map((v) => {
                  const on = sel[o.id] === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      className={`qm-chip${on ? " on" : ""}`}
                      disabled={!liveValues.has(v.id)}
                      aria-pressed={on}
                      onClick={() => pick(o.id, v.id)}
                    >
                      {v.colorHex ? <span className="qm-dot" style={{ background: v.colorHex }} /> : null}
                      {v.label}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          );
        })}

        <div className="qm-buy">
          <div className="qm-qty" aria-label="الكمية">
            <button
              type="button"
              aria-label="إنقاص"
              disabled={stock < 1 || qtyEff <= 1}
              onClick={() => setQty(qtyEff - 1)}
            >
              −
            </button>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={Math.max(1, stock)}
              value={qtyEff}
              disabled={stock < 1}
              aria-label="الكمية"
              onChange={(e) => {
                const n = Math.floor(Number(e.target.value));
                setQty(Number.isFinite(n) && n > 0 ? n : 1);
              }}
            />
            <button
              type="button"
              aria-label="زيادة"
              disabled={stock < 1 || qtyEff >= stock}
              onClick={() => setQty(qtyEff + 1)}
            >
              +
            </button>
          </div>
          <button type="button" className="qm-btn qm-btn-gold qm-add" disabled={!canBuy} onClick={add}>
            {canBuy ? "إضافة إلى السلة" : "غير متوفر"}
          </button>
        </div>
        {stock > 0 && qtyEff >= stock ? (
          <p className="qm-note">الحد الأقصى المتاح: {stock}</p>
        ) : null}
        <p className="qm-note" role="status" aria-live="polite">
          {note}
        </p>
      </div>

      {zoom && cur && (
        <div className="qm-zoom" role="dialog" aria-modal="true" aria-label="معرض الصور" onClick={() => setZoom(false)}>
          <button
            type="button"
            className="qm-zoom-btn qm-zoom-x"
            aria-label="إغلاق"
            onClick={() => setZoom(false)}
          >
            <CloseIcon />
          </button>
          {images.length > 1 && (
            <>
              <button
                type="button"
                className="qm-zoom-btn qm-zoom-prev"
                aria-label="السابقة"
                onClick={(e) => {
                  e.stopPropagation();
                  setActive((i) => (i - 1 + images.length) % images.length);
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
              </button>
              <button
                type="button"
                className="qm-zoom-btn qm-zoom-next"
                aria-label="التالية"
                onClick={(e) => {
                  e.stopPropagation();
                  setActive((i) => (i + 1) % images.length);
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
              </button>
            </>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cur.url} alt={cur.alt} onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
