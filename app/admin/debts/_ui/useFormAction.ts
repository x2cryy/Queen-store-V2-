"use client";

import { useRef, useState, type FormEvent } from "react";

// Calls the server action from the submit handler (no effects, no form reset on failure).
export function useFormAction<S extends { ok: boolean; message: string }>(
  action: (prev: S | null, f: FormData) => Promise<S | null>,
  onDone?: (s: S) => void,
) {
  const [state, setState] = useState<S | null>(null);
  const [pending, setPending] = useState(false);
  const busy = useRef(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy.current) return;
    const fd = new FormData(e.currentTarget);
    busy.current = true;
    setPending(true);
    try {
      const r = await action(null, fd);
      setState(r);
      if (r && onDone) onDone(r);
    } catch {
      setState({ ok: false, message: "تعذر الاتصال بالخادم، تحقق من الاتصال وحاول مرة أخرى." } as S);
    } finally {
      busy.current = false;
      setPending(false);
    }
  }
  return { state, pending, onSubmit };
}
