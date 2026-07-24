"use client";

import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useRef } from "react";
import { auth } from "../lib/firebase";
import { saveProfile, subscribeToUserLogs } from "../lib/firestore-service";
import { useAppStore } from "../store/app-store";

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
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    if (!auth) {
      initialAuthCheck.current = true;
      return;
    }
    let stopSync: () => void = () => undefined;
    return onAuthStateChanged(auth, (user) => {
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
  }, [mode, preferences, setLogs, setMode, setProfile, showToast]);

  return children;
}
