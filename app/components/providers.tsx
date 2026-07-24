"use client";

import { useEffect, useRef } from "react";
import { useAppStore } from "../store/app-store";
import { PwaLifecycle } from "./pwa-lifecycle";

function effectiveTheme(theme: "light" | "dark" | "system") {
  if (theme !== "system") return theme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const preferences = useAppStore((state) => state.preferences);
  const mode = useAppStore((state) => state.mode);
  const setMode = useAppStore((state) => state.setMode);
  const setProfile = useAppStore((state) => state.setProfile);
  const setLogs = useAppStore((state) => state.setLogs);
  const showToast = useAppStore((state) => state.showToast);
  const initialAuthCheck = useRef(false);

  useEffect(() => {
    const apply = () => {
      document.documentElement.dataset.theme = effectiveTheme(preferences.theme);
    };
    apply();
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [preferences.theme]);

  useEffect(() => {
    let disposed = false;
    let stopSync: () => void = () => undefined;
    let stopAuth: () => void = () => undefined;
    const initializeAuth = async () => {
      const [{ onAuthStateChanged }, { auth }, { saveProfile, subscribeToUserLogs }] = await Promise.all([
        import("firebase/auth"),
        import("../lib/firebase"),
        import("../lib/firestore-service"),
      ]);
      if (disposed) return;
      if (!auth) {
        initialAuthCheck.current = true;
        return;
      }
      stopAuth = onAuthStateChanged(auth, (user) => {
        stopSync();
        if (user) {
          const profile = {
            uid: user.uid,
            email: user.email ?? undefined,
            preferredName: user.displayName?.split(" ")[0] || preferences.preferredName || "You",
            createdAt: user.metadata.creationTime ?? new Date().toISOString(),
            demo: false,
          };
          setMode("firebase");
          setProfile(profile);
          void saveProfile(user.uid, profile, preferences);
          stopSync = subscribeToUserLogs(
            user.uid,
            setLogs,
            () => showToast("Sync paused. Your changes will retry when you reconnect."),
          );
        } else if (mode === "firebase") {
          setMode("anonymous");
          setProfile(null);
          setLogs([]);
        }
        initialAuthCheck.current = true;
      });
    };
    const idleWindow = window as Window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
      cancelIdleCallback?: (handle: number) => void;
    };
    const handle = idleWindow.requestIdleCallback
      ? idleWindow.requestIdleCallback(() => void initializeAuth(), { timeout: 1200 })
      : window.setTimeout(() => void initializeAuth(), 250);
    return () => {
      disposed = true;
      if (idleWindow.cancelIdleCallback) idleWindow.cancelIdleCallback(handle);
      else window.clearTimeout(handle);
      stopAuth();
      stopSync();
    };
  }, [mode, preferences, setLogs, setMode, setProfile, showToast]);

  return (
    <>
      {children}
      <PwaLifecycle />
    </>
  );
}
