import Link from "next/link";
import type { Banner } from "../../lib/shop/queries";
import { publicImageUrl, safeHref } from "../../lib/shop/images";

export default function Hero({ banners }: { banners: Banner[] }) {
  if (banners.length === 0) {
    return (
      <section className="qm-hero qm-hero-plain">
        <div className="qm-wrap">
          <p className="qm-logo qm-hero-logo">QUEEN STORE</p>
          <Link href="/products" className="qm-btn qm-btn-gold">تسوق الآن</Link>
        </div>
      </section>
    );
  }
  return (
    <section className="qm-hero" aria-label="العروض">
      <div className="qm-slides">
        {banners.map((b, i) => {
          const src = publicImageUrl("banners", b.image_path);
          const href = safeHref(b.link_url) ?? "/products";
          const Title = i === 0 ? "h1" : "h2";
          return (
            <div className="qm-slide" key={b.id}>
              {src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={src} alt="" loading={i === 0 ? "eager" : "lazy"} decoding="async" />
              ) : null}
              <div className="qm-slide-shade" />
              <div className="qm-wrap qm-slide-body">
                {b.title ? <Title>{b.title}</Title> : null}
                {b.subtitle ? <p>{b.subtitle}</p> : null}
                <Link href={href} className="qm-btn qm-btn-gold">تسوق الآن</Link>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
