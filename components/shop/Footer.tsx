import Link from "next/link";
import type { Category } from "../../lib/shop/queries";

export default function Footer({ categories }: { categories: Category[] }) {
  const top = categories.filter((c) => c.parent_id == null).slice(0, 6);
  return (
    <footer className="qm-footer">
      <div className="qm-wrap qm-fgrid">
        <div>
          <Link href="/" className="qm-logo qm-flogo">QUEEN STORE</Link>
        </div>
        <nav aria-label="تسوق">
          <h3>تسوق</h3>
          <Link href="/products">جميع المنتجات</Link>
          <Link href="/categories">الأقسام</Link>
          {top.map((c) => (
            <Link key={c.id} href={`/category/${encodeURIComponent(c.slug)}`}>{c.name}</Link>
          ))}
        </nav>
        <nav aria-label="حسابي">
          <h3>حسابي</h3>
          <Link href="/account">حسابي</Link>
          <Link href="/cart">السلة</Link>
        </nav>
        {/* مكان صفحات السياسات (الخصوصية، الاستبدال، التوصيل): تُضاف لاحقاً من المحتوى */}
      </div>
      <div className="qm-wrap qm-copy">© {new Date().getFullYear()} QUEEN STORE</div>
    </footer>
  );
}
