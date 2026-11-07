import Link from "next/link";
import { getProfile, getRole, requireUser } from "../../lib/auth/session";
import { signOut } from "../(auth)/actions";
import { Notice } from "../_components/auth/Notice";

export const metadata = { title: "حسابي | QUEEN STORE" };

const ROLE_LABEL = { owner: "مالكة المتجر", staff: "مدير", customer: "زبون" } as const;

function fmtDate(iso: string | null | undefined, withTime = false) {
  if (!iso) return "غير متوفر";
  return new Date(iso).toLocaleString("ar-IQ", {
    year: "numeric", month: "long", day: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

export default async function AccountPage() {
  const user = await requireUser("/account");
  const [profile, role] = await Promise.all([getProfile(), getRole()]);

  return (
    <>
      <h1>حسابي</h1>
      <p className="q-lead">{profile?.full_name ? `أهلاً ${profile.full_name}` : "أهلاً بك"}</p>
      {!user.email_confirmed_at && (
        <Notice kind="info">لم يتم تأكيد بريدك الإلكتروني بعد.</Notice>
      )}
      <ul className="q-list">
        <li><span className="k">البريد الإلكتروني</span><span className="v" dir="ltr">{user.email}</span></li>
        <li><span className="k">رقم الهاتف</span><span className="v" dir="ltr">{profile?.phone ?? "غير مضاف"}</span></li>
        <li><span className="k">نوع الحساب</span><span className="v">{ROLE_LABEL[role]}</span></li>
        <li><span className="k">حالة الحساب</span><span className="v">{profile?.account_status === "blocked" ? "محظور" : "فعّال"}</span></li>
        <li><span className="k">تاريخ التسجيل</span><span className="v">{fmtDate(profile?.created_at ?? user.created_at)}</span></li>
        <li><span className="k">آخر تسجيل دخول</span><span className="v">{fmtDate(user.last_sign_in_at, true)}</span></li>
      </ul>
      <div className="q-stack">
        <Link href="/account/profile" className="q-btn">تعديل الملف الشخصي</Link>
        <Link href="/orders" className="q-btn q-btn--ghost">طلباتي</Link>
        <Link href="/" className="q-btn q-btn--ghost">العودة إلى المتجر</Link>
        <form action={signOut}>
          <button type="submit" className="q-btn q-btn--ghost">تسجيل الخروج</button>
        </form>
      </div>
    </>
  );
}
