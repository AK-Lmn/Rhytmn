"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createDemoLogs } from "../data/demo";
import { DEFAULT_PREFERENCES } from "../lib/constants";
import type { HealthLog, Preferences, UserProfile } from "../types";

interface AppState {
  mode: "anonymous" | "demo" | "firebase";
  profile: UserProfile | null;
  preferences: Preferences;
  logs: HealthLog[];
  toast: string | null;
  setMode: (mode: AppState["mode"]) => void;
  setProfile: (profile: UserProfile | null) => void;
  setPreferences: (preferences: Partial<Preferences>) => void;
  setLogs: (logs: HealthLog[]) => void;
  upsertLog: (log: HealthLog) => void;
  deleteLog: (id: string) => void;
  clearLogs: () => void;
  startDemo: () => void;
  resetSession: () => void;
  showToast: (message: string) => void;
  clearToast: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      mode: "anonymous",
      profile: null,
      preferences: { ...DEFAULT_PREFERENCES },
      logs: [],
      toast: null,
      setMode: (mode) => set({ mode }),
      setProfile: (profile) => set({ profile }),
      setPreferences: (preferences) =>
        set((state) => ({ preferences: { ...state.preferences, ...preferences } })),
      setLogs: (logs) => set({ logs }),
      upsertLog: (log) =>
        set((state) => ({
          logs: [log, ...state.logs.filter((item) => item.id !== log.id)].sort(
            (a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`),
          ),
        })),
      deleteLog: (id) => set((state) => ({ logs: state.logs.filter((log) => log.id !== id) })),
      clearLogs: () => set({ logs: [] }),
      startDemo: () =>
        set({
          mode: "demo",
          profile: {
            uid: "demo-user",
            preferredName: "Alex",
            createdAt: new Date().toISOString(),
            demo: true,
          },
          preferences: { ...DEFAULT_PREFERENCES },
          logs: createDemoLogs(),
        }),
      resetSession: () =>
        set({
          mode: "anonymous",
          profile: null,
          preferences: { ...DEFAULT_PREFERENCES },
          logs: [],
        }),
      showToast: (message) => set({ toast: message }),
      clearToast: () => set({ toast: null }),
    }),
    {
      name: "rhythm-private-store",
      partialize: (state) => ({
        mode: state.mode,
        profile: state.profile,
        preferences: state.preferences,
        logs: state.mode === "demo" ? state.logs : [],
      }),
    },
  ),
);
