"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { RefreshCw, Volume2, VolumeX } from "lucide-react";
import { formatDateTime, formatMoney } from "../../../../lib/admin/format";

export type LiveOrder = {
  id: string; order_number: string; customer_name: string; phone: string; total: number;
  status: string; payment_status: string; created_at: string; governorate: string | null;
  status_label: string; pay_label: string;
};

const COLS = [
  ["new", "جديد"],
  ["preparing", "قيد التجهيز"],
  ["ready", "جاهز"],
] as const;

const POLL_MS = 8000;

function beep(ctx: AudioContext) {
  const t = ctx.currentTime;
  [660, 880].forEach((f, i) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    const s = t + i * 0.22;
    o.type = "sine";
    o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, s);
    g.gain.exponentialRampToValueAtTime(0.4, s + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, s + 0.2);
    o.connect(g);
    g.connect(ctx.destination);
    o.start(s);
    o.stop(s + 0.22);
  });
}

const box: CSSProperties = {
  border: "1px solid var(--c-line, #ECE6DA)", borderRadius: 14, background: "var(--c-bg-soft, #FAF8F3)",
  padding: 10, display: "grid", gap: 8, alignContent: "start", minWidth: 0,
};

export function LiveBoard({ orders }: { orders: LiveOrder[] }) {
  const router = useRouter();
  const [sound, setSound] = useState(false);
  const [fresh, setFresh] = useState<string[]>([]);
  const [updated, setUpdated] = useState<string>("");
  const ctx = useRef<AudioContext | null>(null);
  const soundRef = useRef(false);
  const seen = useRef<Set<string>>(new Set(orders.map((o) => o.id)));

  useEffect(() => {
    soundRef.current = sound;
  }, [sound]);

  useEffect(() => {
    const t = setInterval(() => router.refresh(), POLL_MS);
    return () => clearInterval(t);
  }, [router]);

  useEffect(() => {
    const added = orders.filter((o) => !seen.current.has(o.id));
    orders.forEach((o) => seen.current.add(o.id));
    setUpdated(new Date().toLocaleTimeString("ar-IQ", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    if (added.length === 0) return;
    setFresh(added.map((o) => o.id));
    if (soundRef.current && ctx.current) beep(ctx.current);
    const t = setTimeout(() => setFresh([]), 6000);
    return () => clearTimeout(t);
  }, [orders]);

  async function toggleSound() {
    if (sound) {
      setSound(false);
      return;
    }
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!ctx.current) ctx.current = new AC();
    await ctx.current.resume();
    beep(ctx.current);
    setSound(true);
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 14 }}>
        <button type="button" className={sound ? "ds-btn ds-btn-gold" : "ds-btn"} onClick={toggleSound}>
          {sound ? <Volume2 size={16} /> : <VolumeX size={16} />} {sound ? "صوت التنبيه مفعّل" : "تفعيل صوت التنبيه"}
        </button>
        <button type="button" className="ds-btn" onClick={() => router.refresh()} aria-label="تحديث الآن">
          <RefreshCw size={16} /> تحديث
        </button>
        <span className="ds-desc">يتحدث تلقائياً كل 8 ثوانٍ{updated ? " - آخر تحديث " + updated : ""}</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
        {COLS.map(([key, label]) => {
          const list = orders.filter((o) => o.status === key);
          return (
            <section key={key} style={box} aria-label={label}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 2px" }}>
                <strong>{label}</strong>
                <span className={"ao-badge ao-st-" + key}>{list.length}</span>
              </div>
              <AnimatePresence initial={false}>
                {list.length === 0 ? (
                  <div key="empty" className="ds-empty">لا توجد طلبات.</div>
                ) : (
                  list.map((o) => (
                    <motion.div
                      key={o.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.18 }}
                      style={{
                        border: "1px solid " + (fresh.includes(o.id) ? "var(--c-gold-dark, #7D6335)" : "var(--c-line, #ECE6DA)"),
                        boxShadow: fresh.includes(o.id) ? "0 0 0 3px rgba(184,155,106,.35)" : "none",
                        borderRadius: 12, background: "var(--c-surface, #fff)", minWidth: 0,
                      }}
                    >
                      <Link href={"/admin/orders/manage?open=" + o.id} scroll={false} style={{ display: "grid", gap: 6, padding: 12, color: "inherit", textDecoration: "none" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                          <strong dir="ltr">{o.order_number}</strong>
                          <strong>{formatMoney(Number(o.total) || 0)}</strong>
                        </div>
                        <div style={{ overflowWrap: "anywhere" }}>{o.customer_name}</div>
                        <div dir="ltr" style={{ fontSize: 13, color: "var(--c-muted, #6B6458)", textAlign: "start" }}>{o.phone}</div>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                          <span className={"ao-badge ao-pay-" + o.payment_status}>{o.pay_label}</span>
                          <span style={{ fontSize: 12, color: "var(--c-muted2, #8A8372)" }}>{o.governorate ? o.governorate + " - " : ""}{formatDateTime(o.created_at)}</span>
                        </div>
                      </Link>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </section>
          );
        })}
      </div>
    </div>
  );
}
