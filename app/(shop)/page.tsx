import Link from "next/link";
import Hero from "../../components/shop/Hero";
import ProductCard from "../../components/shop/ProductCard";
import { getBanners, getCategories, getFeatured, getLatest } from "../../lib/shop/queries";

export const revalidate = 60;

export default async function Home() {
  let failed = false;
  const safe = async <T,>(fn: () => Promise<T[]>): Promise<T[]> => {
    try {
      return await fn();
    } catch {
      failed = true;
      return [];
    }
  };

  const [banners, cats, featured, latest] = await Promise.all([
    safe(getBanners),
    safe(getCategories),
    safe(getFeatured),
    safe(getLatest),
  ]);

  const top = cats.filter((c) => c.parent_id == null).slice(0, 12);
  const noProducts = featured.length === 0 && latest.length === 0;

  return (
    <>
      <Hero banners={banners} />

      {top.length > 0 && (
        <section className="qm-sec qm-wrap" aria-label="الأقسام">
          <div className="qm-sec-h">
            <h2>تسوق حسب القسم</h2>
            <Link href="/categories" className="qm-more">كل الأقسام</Link>
          </div>
          <div className="qm-cats">
            {top.map((c) => (
              <Link key={c.id} href={`/category/${encodeURIComponent(c.slug)}`} className="qm-cat">
                <span className="qm-cat-ico">{c.name.trim().charAt(0)}</span>
                {c.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {featured.length > 0 && (
        <section className="qm-sec qm-wrap" aria-label="منتجات مميزة">
          <div className="qm-sec-h">
            <h2>منتجات مميزة</h2>
            <Link href="/products" className="qm-more">عرض الكل</Link>
          </div>
          <div className="qm-grid">
            {featured.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        </section>
      )}

      {latest.length > 0 && (
        <section className="qm-sec qm-wrap" aria-label="وصل حديثاً">
          <div className="qm-sec-h">
            <h2>وصل حديثاً</h2>
            <Link href="/products" className="qm-more">عرض الكل</Link>
          </div>
          <div className="qm-grid">
            {latest.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        </section>
      )}

      {noProducts && (
        <div className="qm-wrap">
          <div className="qm-empty">
            <h2>{failed ? "تعذر تحميل المنتجات حالياً" : "لا توجد منتجات منشورة بعد"}</h2>
            <p>{failed ? "تحقق من اتصالك وأعد المحاولة بعد قليل." : "تابعنا قريباً."}</p>
          </div>
        </div>
      )}
    </>
  );
}
