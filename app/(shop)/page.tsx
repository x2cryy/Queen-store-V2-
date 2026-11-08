import Hero from "../../components/shop/Hero";
import HomeSections from "../../components/shop/HomeSections";
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

  const [banners, cats, featured, latest] = await Promise.all([
    safe(getBanners),
    on("categories") ? safe(getCategories) : Promise.resolve([] as Category[]),
    on("featured") ? safe(() => getFeatured(lim("featured"))) : Promise.resolve([] as ProductCardData[]),
    on("latest") ? safe(() => getLatest(lim("latest"))) : Promise.resolve([] as ProductCardData[]),
  ]);

  const noProducts = (on("featured") || on("latest")) && featured.length === 0 && latest.length === 0;


  return (
    <>
      <Hero banners={banners} />

      <HomeSections sections={content.sections} cats={cats} featured={featured} latest={latest} />

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
