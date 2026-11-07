import Link from "next/link";
import type { Category } from "../../lib/shop/queries";
import MobileMenu from "./MobileMenu";
import SearchBox from "./SearchBox";
import CartLink from "./CartLink";
import { UserIcon } from "./icons";

export default function Header({ categories }: { categories: Category[] }) {
  const top = categories.filter((c) => c.parent_id == null);
  return (
    <header className="qm-header">
      <div className="qm-wrap qm-hrow">
        <MobileMenu categories={top} />
        <Link href="/" className="qm-logo qm-hlogo" aria-label="QUEEN STORE">
          QUEEN STORE
        </Link>
        <SearchBox />
        <nav className="qm-icons" aria-label="حسابي والسلة">
          <Link href="/account" className="qm-ib" aria-label="حسابي"><UserIcon /></Link>
          <CartLink />
        </nav>
      </div>
      <nav className="qm-wrap qm-cats-d" aria-label="الأقسام">
        <Link href="/products">جميع المنتجات</Link>
        {top.slice(0, 8).map((c) => (
          <Link key={c.id} href={`/category/${encodeURIComponent(c.slug)}`}>{c.name}</Link>
        ))}
      </nav>
    </header>
  );
}
