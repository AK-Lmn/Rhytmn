"use client";

import { useEffect } from "react";
import { useAppStore } from "../store/app-store";
import { PwaLifecycle } from "./pwa-lifecycle";

function effectiveTheme(theme: "light" | "dark" | "system") {
  if (theme !== "system") return theme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function ProfileGate({ failed = false }: { failed?: boolean }) {
  return (
    <main className="auth-panel profile-gate">
      <section className="auth-card profile-loading" role="status" aria-live="polite">
        <span className="logo-mark large" aria-hidden="true"><i /><i /><i /></span>
        <h1>{failed ? "We couldn’t load your profile" : "Opening your private space…"}</h1>
        <p>
          {failed
            ? "Your saved data was not changed. Check your connection and try again."
            : "Loading your saved profile and settings."}
        </p>
        {failed ? <button onClick={() => window.location.reload()}>Try again</button> : null}
      </section>
    </main>
  );
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const preferences = useAppStore((state) => state.preferences);
  const mode = useAppStore((state) => state.mode);
  const accountStatus = useAppStore((state) => state.accountStatus);

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
    let generation = 0;
    let stopSync: () => void = () => undefined;
    let stopAuth: () => void = () => undefined;

    void (async () => {
      const [
        { onAuthStateChanged },
        { auth },
        { loadAuthenticatedAccount, subscribeToUserLogs },
      ] = await Promise.all([
        import("firebase/auth"),
        import("../lib/firebase"),
        import("../lib/firestore-service"),
      ]);
      if (disposed) return;
      if (!auth) {
        useAppStore.getState().completeSignedOutSession();
        return;
      }

      stopAuth = onAuthStateChanged(auth, async (user) => {
        const currentGeneration = ++generation;
        stopSync();
        stopSync = () => undefined;

        if (!user) {
          useAppStore.getState().completeSignedOutSession();
          return;
        }

        useAppStore.getState().beginAuthenticatedSession();
        try {
          const account = await loadAuthenticatedAccount({
            uid: user.uid,
            email: user.email ?? undefined,
            displayName: user.displayName ?? undefined,
            createdAt: user.metadata.creationTime ?? undefined,
          });
          if (disposed || currentGeneration !== generation) return;

          useAppStore
            .getState()
            .resolveAuthenticatedSession(account.profile, account.preferences);
          stopSync = subscribeToUserLogs(
            user.uid,
            (logs) => useAppStore.getState().setLogs(logs),
            () =>
              useAppStore
                .getState()
                .showToast("Sync paused. Your changes will retry when you reconnect."),
          );
        } catch {
          if (disposed || currentGeneration !== generation) return;
          useAppStore.getState().failAuthenticatedSession();
        }
      });
    })();

    return () => {
      disposed = true;
      generation += 1;
      stopAuth();
      stopSync();
    };
  }, []);

  const waiting =
    accountStatus === "checking" ||
    (mode === "firebase" && accountStatus === "loading");
  const failed = mode === "firebase" && accountStatus === "error";

  return (
    <>
      {waiting || failed ? <ProfileGate failed={failed} /> : children}
      <PwaLifecycle />
    </>
  );
}
