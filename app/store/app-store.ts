"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createDemoLogs } from "../data/demo";
import { DEFAULT_PREFERENCES, DEMO_PREFERENCES } from "../lib/constants";
import type { HealthLog, Preferences, UserProfile } from "../types";

export type AccountStatus = "checking" | "signedOut" | "loading" | "ready" | "error";

export interface AppState {
  mode: "anonymous" | "demo" | "firebase";
  accountStatus: AccountStatus;
  profile: UserProfile | null;
  preferences: Preferences;
  logs: HealthLog[];
  toast: string | null;
  beginAuthenticatedSession: () => void;
  resolveAuthenticatedSession: (profile: UserProfile, preferences: Preferences) => void;
  failAuthenticatedSession: () => void;
  completeSignedOutSession: () => void;
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

type PersistedSession = Pick<AppState, "mode" | "profile" | "preferences" | "logs">;

export function sanitizePersistedSession(value: unknown): Partial<AppState> {
  const persisted = value as Partial<PersistedSession> | undefined;
  if (persisted?.mode !== "demo" || persisted.profile?.demo !== true) return {};
  return {
    mode: "demo",
    accountStatus: "ready",
    profile: persisted.profile,
    preferences: { ...DEMO_PREFERENCES, ...persisted.preferences, preferredName: "Alex" },
    logs: Array.isArray(persisted.logs) ? persisted.logs : [],
  };
}

export function selectDisplayName(state: Pick<AppState, "mode" | "profile" | "preferences">) {
  if (state.mode === "firebase") return state.profile?.preferredName ?? "";
  return state.profile?.preferredName ?? state.preferences.preferredName;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      mode: "anonymous",
      accountStatus: "checking",
      profile: null,
      preferences: { ...DEFAULT_PREFERENCES },
      logs: [],
      toast: null,
      beginAuthenticatedSession: () =>
        set({
          mode: "firebase",
          accountStatus: "loading",
          profile: null,
          preferences: { ...DEFAULT_PREFERENCES },
          logs: [],
        }),
      resolveAuthenticatedSession: (profile, preferences) =>
        set({
          mode: "firebase",
          accountStatus: "ready",
          profile,
          preferences: { ...preferences, preferredName: profile.preferredName },
        }),
      failAuthenticatedSession: () =>
        set({ mode: "firebase", accountStatus: "error", profile: null, logs: [] }),
      completeSignedOutSession: () =>
        set((state) =>
          state.mode === "demo"
            ? { accountStatus: "ready" }
            : {
                mode: "anonymous",
                accountStatus: "signedOut",
                profile: null,
                preferences: { ...DEFAULT_PREFERENCES },
                logs: [],
              },
        ),
      setPreferences: (preferences) =>
        set((state) => ({
          preferences: { ...state.preferences, ...preferences },
          profile:
            state.mode === "firebase" &&
            state.profile &&
            typeof preferences.preferredName === "string"
              ? { ...state.profile, preferredName: preferences.preferredName }
              : state.profile,
        })),
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
          accountStatus: "ready",
          profile: {
            uid: "demo-user",
            preferredName: "Alex",
            createdAt: new Date().toISOString(),
            demo: true,
          },
          preferences: { ...DEMO_PREFERENCES },
          logs: createDemoLogs(),
        }),
      resetSession: () =>
        set({
          mode: "anonymous",
          accountStatus: "signedOut",
          profile: null,
          preferences: { ...DEFAULT_PREFERENCES },
          logs: [],
        }),
      showToast: (message) => set({ toast: message }),
      clearToast: () => set({ toast: null }),
    }),
    {
      name: "rhythm-private-store",
      version: 2,
      partialize: (state) =>
        state.mode === "demo"
          ? {
              mode: state.mode,
              profile: state.profile,
              preferences: state.preferences,
              logs: state.logs,
            }
          : {
              mode: "anonymous",
              profile: null,
              preferences: { ...DEFAULT_PREFERENCES },
              logs: [],
            },
      merge: (persisted, current) => ({
        ...current,
        ...sanitizePersistedSession(persisted),
      }),
    },
  ),
);
