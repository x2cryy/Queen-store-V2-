"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { FlaskConical, Store } from "lucide-react";
import QuickActions from "./QuickActions";
import SummaryCards from "./SummaryCards";
import RecentOrders from "./RecentOrders";
import OrderDrawer from "./OrderDrawer";
import StockAlerts from "./StockAlerts";
import FollowUp from "./FollowUp";
import { HomeError, HomeSkeleton } from "./States";
import { EMPTY_DATA, MOCK_DATA, MOCK_LABEL, type PreviewMode } from "../_data/mock";
import { longDate } from "../_lib/utils";

const MODES: { key: PreviewMode; label: string }[] = [
  { key: "data", label: "بيانات" },
  { key: "empty", label: "فارغ" },
  { key: "loading", label: "تحميل" },
  { key: "error", label: "خطأ" },
];

export default function HomeClient({ today }: { today: string }) {
  const [mode, setMode] = useState<PreviewMode>("data");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const data = mode === "data" ? MOCK_DATA : mode === "empty" ? EMPTY_DATA : null;
  const selected = data?.orders.find((o) => o.id === selectedId) ?? null;

  const closeDrawer = useCallback(() => {
    const id = selectedId;
    setSelectedId(null);
    if (id !== null) setTimeout(() => document.getElementById(`hp-order-${id}`)?.focus(), 0);
  }, [selectedId]);

  let content: React.ReactNode = null;
  if (mode === "loading") content = <HomeSkeleton />;
  else if (mode === "error") content = <HomeError onRetry={() => setMode("data")} />;
  else if (data)
    content = (
      <div className="hp-flow">
        <SummaryCards summary={data.summary} />
        <div className="hp-main">
          <RecentOrders orders={data.orders} total={data.ordersTotal} selectedId={selectedId} onOpen={setSelectedId} />
          <div className="hp-side">
            <StockAlerts items={data.stock} />
            <FollowUp items={data.follow} />
          </div>
        </div>
      </div>
    );

  return (
    <MotionConfig reducedMotion="user">
      <div className="hp-root" dir="rtl">
        <div className="hp-body">
          <div className="hp-strip">
            <span className="hp-badge">
              <FlaskConical size={16} aria-hidden /> {MOCK_LABEL}
            </span>
            <div className="hp-seg-wrap">
              <span>أدوات فحص المعاينة:</span>
              <div className="hp-seg" role="group" aria-label="حالة المعاينة">
                {MODES.map((m) => (
                  <button
                    key={m.key}
                    type="button"
                    aria-pressed={mode === m.key}
                    onClick={() => {
                      setMode(m.key);
                      setSelectedId(null);
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <header className="hp-head">
            <div>
              <h1 className="hp-title">الرئيسية</h1>
              <p className="hp-desc">طلباتك وتنبيهاتك وإجراءاتك اليومية في مكان واحد</p>
              <p className="hp-date">{longDate(today)}</p>
            </div>
            <Link className="hp-btn" href="/" target="_blank" rel="noopener noreferrer">
              <Store size={18} aria-hidden /> معاينة المتجر
            </Link>
          </header>

          <QuickActions />

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              {content}
            </motion.div>
          </AnimatePresence>
        </div>

        <OrderDrawer order={selected} onClose={closeDrawer} />
      </div>
    </MotionConfig>
  );
}
