"use client";

import { useActionState } from "react";
import Link from "next/link";
import { saveBanner, saveSetting, type FS } from "../actions";

export type BannerInit = {
  id: string; title: string; subtitle: string | null; link_url: string | null;
  sort_order: number; is_active: boolean; starts_at: string | null; ends_at: string | null;
};
const local = (iso: string | null) => (iso ? new Date(iso).toISOString().slice(0, 10) : "");

export function BannerForm({ banner }: { banner?: BannerInit }) {
  const [st, action, pending] = useActionState<FS, FormData>(saveBanner, {});
  const b = banner;
  return (
    <form action={action}>
      {b ? <input type="hidden" name="id" value={b.id} /> : null}
      <div className="ds-form">
        <div>
          <label className="ds-label" htmlFor="title">العنوان</label>
          <input className="ds-input" id="title" name="title" defaultValue={b?.title ?? ""} required />
        </div>
        <div>
          <label className="ds-label" htmlFor="subtitle">العنوان الفرعي</label>
          <input className="ds-input" id="subtitle" name="subtitle" defaultValue={b?.subtitle ?? ""} />
        </div>
        <div>
          <label className="ds-label" htmlFor="link_url">الرابط عند الضغط</label>
          <input className="ds-input" id="link_url" name="link_url" dir="ltr" defaultValue={b?.link_url ?? ""} />
        </div>
        <div>
          <label className="ds-label" htmlFor="sort_order">الترتيب</label>
          <input className="ds-input" id="sort_order" name="sort_order" type="number" defaultValue={b?.sort_order ?? 0} />
        </div>
        <div>
          <label className="ds-label" htmlFor="starts_at">يبدأ في (اختياري)</label>
          <input className="ds-input" id="starts_at" name="starts_at" type="date" defaultValue={local(b?.starts_at ?? null)} />
        </div>
        <div>
          <label className="ds-label" htmlFor="ends_at">ينتهي في (اختياري)</label>
          <input className="ds-input" id="ends_at" name="ends_at" type="date" defaultValue={local(b?.ends_at ?? null)} />
        </div>
        <div>
          <label className="ds-label" htmlFor="file">{b ? "تغيير الصورة (اختياري)" : "الصورة"}</label>
          <input className="ds-input" style={{ paddingTop: 8 }} id="file" name="file" type="file" accept="image/jpeg,image/png,image/webp" />
        </div>
      </div>
      <label style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 14, color: "var(--c-text, #17140F)" }}>
        <input type="checkbox" name="is_active" defaultChecked={b ? b.is_active : true} /> فعّال (ظاهر في المتجر)
      </label>
      {st.error ? <p role="alert" style={{ color: "#B91C1C", marginTop: 12, fontWeight: 600 }}>{st.error}</p> : null}
      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <button className="ds-btn ds-btn-gold" type="submit" disabled={pending}>
          {pending ? "جارٍ الحفظ..." : b ? "حفظ التعديلات" : "إضافة البنر"}
        </button>
        {b ? <Link className="ds-btn" href="/admin/content">إلغاء</Link> : null}
      </div>
    </form>
  );
}

export function SettingForm({ k, kind, value }: { k: string; kind: string; value: string }) {
  const [st, action, pending] = useActionState<FS, FormData>(saveSetting, {});
  return (
    <form action={action} style={{ display: "grid", gap: 8 }}>
      <input type="hidden" name="key" value={k} />
      <input type="hidden" name="kind" value={kind} />
      <label className="ds-label" htmlFor={`s-${k}`}><span dir="ltr">{k}</span></label>
      {kind === "json" ? (
        <textarea className="ds-input" style={{ height: 140, padding: 12, fontFamily: "monospace" }} dir="ltr" id={`s-${k}`} name="value" defaultValue={value} />
      ) : kind === "boolean" ? (
        <select className="ds-select" id={`s-${k}`} name="value" defaultValue={value}>
          <option value="true">مفعّل</option>
          <option value="false">متوقف</option>
        </select>
      ) : (
        <input className="ds-input" id={`s-${k}`} name="value" type={kind === "number" ? "number" : "text"} defaultValue={value} />
      )}
      {st.error ? <p role="alert" style={{ color: "#B91C1C", fontWeight: 600, margin: 0 }}>{st.error}</p> : null}
      {st.ok ? <p role="status" style={{ color: "#15803D", fontWeight: 600, margin: 0 }}>{st.ok}</p> : null}
      <div><button className="ds-btn" type="submit" disabled={pending}>{pending ? "جارٍ الحفظ..." : "حفظ"}</button></div>
    </form>
  );
}
