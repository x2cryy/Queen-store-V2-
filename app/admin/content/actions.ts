"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAnyPermission } from "../../../lib/admin/access";
import { createClient } from "../../../lib/supabase/server";

export type FS = { error?: string; ok?: string; n?: number };

const txt = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
};
const dt = (v: FormDataEntryValue | null) => {
  const s = txt(v);
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
};
const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export async function saveBanner(_p: FS, fd: FormData): Promise<FS> {
  await requireAnyPermission(["content"]);
  const id = txt(fd.get("id"));
  const title = txt(fd.get("title"));
  const sort = Number(String(fd.get("sort_order") ?? "0"));
  const starts = dt(fd.get("starts_at"));
  const ends = dt(fd.get("ends_at"));
  const file = fd.get("file");

  if (!title) return { error: "عنوان البنر مطلوب." };
  if (!Number.isInteger(sort)) return { error: "الترتيب يجب أن يكون رقماً صحيحاً." };
  if (starts === undefined || ends === undefined) return { error: "تاريخ غير صحيح." };
  if (starts && ends && starts > ends) return { error: "تاريخ النهاية قبل البداية." };

  const sb = await createClient();
  let image_path: string | undefined;
  if (file instanceof File && file.size > 0) {
    const ext = EXT[file.type];
    if (!ext) return { error: "الصورة يجب أن تكون JPG أو PNG أو WebP." };
    if (file.size > 5 * 1024 * 1024) return { error: "حجم الصورة أكبر من 5 ميغابايت." };
    const path = `${crypto.randomUUID()}.${ext}`;
    const up = await sb.storage.from("banners").upload(path, file, { contentType: file.type });
    if (up.error) return { error: "تعذّر رفع الصورة. قد تحتاج سياسات التخزين لمراجعة." };
    image_path = path;
  }
  if (!id && !image_path) return { error: "صورة البنر مطلوبة." };

  const row = {
    title,
    subtitle: txt(fd.get("subtitle")),
    link_url: txt(fd.get("link_url")),
    sort_order: sort,
    is_active: fd.get("is_active") === "on",
    starts_at: starts,
    ends_at: ends,
    updated_at: new Date().toISOString(),
    ...(image_path ? { image_path } : {}),
  };
  const r = id ? await sb.from("banners").update(row).eq("id", id) : await sb.from("banners").insert(row);
  if (r.error) return { error: "تعذّر حفظ البنر." };
  revalidatePath("/admin/content");
  redirect("/admin/content");
}

export async function toggleBanner(fd: FormData): Promise<void> {
  await requireAnyPermission(["content"]);
  const id = txt(fd.get("id"));
  if (!id) return;
  const sb = await createClient();
  await sb.from("banners").update({ is_active: fd.get("next") === "1", updated_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/admin/content");
}

export async function deleteBanner(fd: FormData): Promise<void> {
  await requireAnyPermission(["content"]);
  const id = txt(fd.get("id"));
  if (!id) return;
  const sb = await createClient();
  await sb.from("banners").delete().eq("id", id);
  revalidatePath("/admin/content");
}

export async function saveSetting(_p: FS, fd: FormData): Promise<FS> {
  await requireAnyPermission(["content"]);
  const key = txt(fd.get("key"));
  const kind = String(fd.get("kind") ?? "string");
  const raw = String(fd.get("value") ?? "");
  if (!key) return { error: "مفتاح غير صحيح." };
  let value: unknown;
  if (kind === "number") {
    value = Number(raw);
    if (!Number.isFinite(value as number)) return { error: "القيمة يجب أن تكون رقماً." };
  } else if (kind === "boolean") {
    value = raw === "true";
  } else if (kind === "json") {
    try { value = JSON.parse(raw); } catch { return { error: "صيغة JSON غير صحيحة." }; }
  } else {
    value = raw;
  }
  const sb = await createClient();
  const { error } = await sb.from("site_settings").update({ value, updated_at: new Date().toISOString() }).eq("key", key);
  if (error) return { error: "تعذّر حفظ الإعداد." };
  revalidatePath("/admin/content");
  return { ok: "تم الحفظ.", n: Date.now() };
}
