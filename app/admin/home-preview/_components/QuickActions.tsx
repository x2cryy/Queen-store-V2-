"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarClock, ChevronDown, Plus, Receipt, Store, Ticket, UserRound, Wallet } from "lucide-react";

export default function QuickActions() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const down = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", down);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", down);
      document.removeEventListener("keydown", key);
    };
  }, [open]);

  return (
    <nav className="hp-quick" aria-label="الإجراءات السريعة">
      <Link className="hp-q" href="/admin/products/new">
        <span className="hp-q-ico">
          <Plus size={20} aria-hidden />
        </span>
        <span className="hp-q-txt">
          <span className="hp-q-title">إنشاء منتج</span>
          <span className="hp-q-sub">يفتح صفحة إنشاء المنتج</span>
        </span>
      </Link>

      <Link className="hp-q" href="/admin/orders/live">
        <span className="hp-q-ico">
          <Receipt size={20} aria-hidden />
        </span>
        <span className="hp-q-txt">
          <span className="hp-q-title">الطلبات المباشرة</span>
          <span className="hp-q-sub">متابعة الطلبات الجارية</span>
        </span>
      </Link>

      <div className="hp-q-wrap" ref={ref}>
        <button
          type="button"
          className="hp-q"
          aria-haspopup="true"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="hp-q-ico">
            <Wallet size={20} aria-hidden />
          </span>
          <span className="hp-q-txt">
            <span className="hp-q-title">إنشاء دين</span>
            <span className="hp-q-sub">اختر نوع الدين</span>
          </span>
          <ChevronDown size={16} aria-hidden style={{ marginInlineStart: "auto" }} />
        </button>
        <AnimatePresence>
          {open && (
            <motion.div
              className="hp-q-menu"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.14 }}
            >
              <Link className="hp-q-opt" href="/admin/debts/personal" onClick={() => setOpen(false)}>
                <UserRound size={16} aria-hidden /> دين شخصي
              </Link>
              <Link className="hp-q-opt" href="/admin/debts/store" onClick={() => setOpen(false)}>
                <Store size={16} aria-hidden /> دين متجر
              </Link>
              <Link className="hp-q-opt" href="/admin/debts/installments" onClick={() => setOpen(false)}>
                <CalendarClock size={16} aria-hidden /> خطة أقساط
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Link className="hp-q" href="/admin/marketing">
        <span className="hp-q-ico">
          <Ticket size={20} aria-hidden />
        </span>
        <span className="hp-q-txt">
          <span className="hp-q-title">إنشاء كوبون</span>
          <span className="hp-q-sub">من قسم التسويق والعروض</span>
        </span>
      </Link>
    </nav>
  );
}
