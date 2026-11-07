"use client";

import { Info } from "lucide-react";

export function HomeSkeleton() {
  return (
    <div className="hp-flow" aria-busy="true">
      <p className="hp-sr" role="status">
        جارٍ تحميل البيانات…
      </p>
      <div className="hp-kpis">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="hp-card">
            <div className="hp-skel" style={{ height: 16, width: "50%" }} />
            <div className="hp-skel" style={{ height: 30, width: "70%", marginTop: 14 }} />
            <div className="hp-skel" style={{ height: 22, width: "60%", marginTop: 14 }} />
          </div>
        ))}
      </div>
      <div className="hp-main">
        <div className="hp-card">
          <div className="hp-skel" style={{ height: 300 }} />
        </div>
        <div className="hp-side">
          <div className="hp-card">
            <div className="hp-skel" style={{ height: 140 }} />
          </div>
          <div className="hp-card">
            <div className="hp-skel" style={{ height: 140 }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function HomeError({ onRetry }: { onRetry: () => void }) {
  return (
    <section className="hp-card" role="alert">
      <div className="hp-empty">
        <Info size={28} aria-hidden />
        <p>
          <b>تعذّر تحميل بيانات الرئيسية</b>
        </p>
        <p>هذه حالة خطأ تجريبية لفحص التصميم. زر «إعادة المحاولة» يعيد عرض البيانات التجريبية فقط.</p>
        <button type="button" className="hp-btn hp-btn--solid" onClick={onRetry}>
          إعادة المحاولة
        </button>
      </div>
    </section>
  );
}
