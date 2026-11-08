import { Fragment, type ReactNode } from "react";
import Link from "next/link";
import Hero from "../../components/shop/Hero";
import ProductCard from "../../components/shop/ProductCard";
import {
  getBanners,
  getCategories,
  getFeatured,
  getLatest,
  type Category,
  type ProductCardData,
} from "../../lib/shop/queries";
import { getSiteContent } from "../../lib/shop/site-content";
import type { HomeSectionId } from "../../lib/shop/site-content-types";

export const revalidate = 60;

export default async function Home() {
  const state = { failed: false };
  const safe = async <T,>(fn: () => Promise<T[]>): Promise<T[]> => {
    try {
      return await fn();
    } catch {
      state.failed = true;
      return [];
    }
  };

  const content = await getSiteContent();
  const byId = new Map(content.sections.map((s) => [s.id, s]));
  const on = (id: HomeSectionId) => byId.get(id)?.visible === true;
  const lim = (id: HomeSectionId) => byId.get(id)?.limit ?? 8;
  const title = (id: HomeSectionId) => byId.get(id)?.title ?? "";

  const [banners, cats, featured, latest] = await Promise.all([
    safe(getBanners),
    on("categories") ? safe(getCategories) : Promise.resolve([] as Category[]),
    on("featured") ? safe(() => getFeatured(lim("featured"))) : Promise.resolve([] as ProductCardData[]),
    on("latest") ? safe(() => getLatest(lim("latest"))) : Promise.resolve([] as ProductCardData[]),
  ]);

  const top = cats.filter((c) => c.parent_id == null).slice(0, lim("categories"));
  const noProducts = (on("featured") || on("latest")) && featured.length === 0 && latest.length === 0;

  // القسم الفارغ يُخفى عن الزبون ولا يُملأ بمنتجات وهمية.
  const blocks: Record<HomeSectionId, ReactNode> = {
    categories:
      top.length > 0 ? (
        <section className="qm-sec qm-wrap" aria-label={title("categories")}>
          <div className="qm-sec-h">
            <h2>{title("categories")}</h2>
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
      ) : null,
    featured:
      featured.length > 0 ? (
        <section className="qm-sec qm-wrap" aria-label={title("featured")}>
          <div className="qm-sec-h">
            <h2>{title("featured")}</h2>
            <Link href="/products" className="qm-more">عرض الكل</Link>
          </div>
          <div className="qm-grid">
            {featured.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        </section>
      ) : null,
    latest:
      latest.length > 0 ? (
        <section className="qm-sec qm-wrap" aria-label={title("latest")}>
          <div className="qm-sec-h">
            <h2>{title("latest")}</h2>
            <Link href="/products" className="qm-more">عرض الكل</Link>
          </div>
          <div className="qm-grid">
            {latest.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        </section>
      ) : null,
  };

  return (
    <>
      <Hero banners={banners} />

      {content.sections.filter((s) => s.visible).map((s) => (
        <Fragment key={s.id}>{blocks[s.id]}</Fragment>
      ))}

      {noProducts && (
        <div className="qm-wrap">
          <div className="qm-empty">
            <h2>{state.failed ? "تعذر تحميل المنتجات حالياً" : "لا توجد منتجات منشورة بعد"}</h2>
            <p>{state.failed ? "تحقق من اتصالك وأعد المحاولة بعد قليل." : "تابعنا قريباً."}</p>
          </div>
        </div>
      )}
    </>
  );
}
