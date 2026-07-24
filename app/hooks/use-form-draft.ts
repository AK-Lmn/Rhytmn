"use client";

import { useEffect } from "react";
import type { FieldValues, UseFormReturn } from "react-hook-form";

export function useFormDraft<T extends FieldValues>(key: string, form: UseFormReturn<T>, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        form.reset(JSON.parse(raw) as T);
      } catch {
        localStorage.removeItem(key);
      }
    }
    const subscription = form.watch((values) => localStorage.setItem(key, JSON.stringify(values)));
    return () => subscription.unsubscribe();
  }, [enabled, form, key]);

  return () => localStorage.removeItem(key);
}
