"use client";

import { startTransition, useActionState, type FormEvent } from "react";

// Submits through startTransition so React does NOT reset the form after a failed save.
export function useFormAction<S>(action: (prev: S | null, f: FormData) => Promise<S | null>) {
  const [state, dispatch, pending] = useActionState<S | null, FormData>(action, null);
  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    const fd = new FormData(e.currentTarget);
    startTransition(() => {
      dispatch(fd);
    });
  }
  return { state, pending, onSubmit };
}
