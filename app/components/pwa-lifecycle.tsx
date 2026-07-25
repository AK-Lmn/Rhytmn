"use client";

import { Download, RefreshCw, WifiOff, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { checkBrowserConnectivity } from "../lib/connectivity";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches
    || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export function PwaLifecycle() {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [updateWorker, setUpdateWorker] = useState<ServiceWorker | null>(null);
  const [online, setOnline] = useState(true);
  const [installDismissed, setInstallDismissed] = useState(false);
  const refreshing = useRef(false);

  useEffect(() => {
    let active = true;
    let connectivityVersion = 0;

    const verifyConnectivity = async (showOfflineOnFailure: boolean) => {
      const version = ++connectivityVersion;
      const reachable = await checkBrowserConnectivity();
      if (!active || version !== connectivityVersion) return;
      if (reachable) setOnline(true);
      else if (showOfflineOnFailure) setOnline(false);
    };
    const onOnline = () => {
      connectivityVersion += 1;
      setOnline(true);
      void verifyConnectivity(false);
    };
    const onOffline = () => {
      connectivityVersion += 1;
      setOnline(false);
    };
    const recheck = () => void verifyConnectivity(true);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") recheck();
    };

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    window.addEventListener("focus", recheck);
    window.addEventListener("pageshow", recheck);
    document.addEventListener("visibilitychange", onVisibilityChange);
    const interval = window.setInterval(recheck, 15_000);
    recheck();

    return () => {
      active = false;
      connectivityVersion += 1;
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("focus", recheck);
      window.removeEventListener("pageshow", recheck);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const capturePrompt = (event: Event) => {
      event.preventDefault();
      if (!isStandalone()) setInstallPrompt(event as InstallPromptEvent);
    };
    const installed = () => setInstallPrompt(null);
    window.addEventListener("beforeinstallprompt", capturePrompt);
    window.addEventListener("appinstalled", installed);
    return () => {
      window.removeEventListener("beforeinstallprompt", capturePrompt);
      window.removeEventListener("appinstalled", installed);
    };
  }, []);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    let active = true;
    const onControllerChange = () => {
      if (!refreshing.current) return;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    void navigator.serviceWorker.register("/sw.js", { scope: "/" }).then((registration) => {
      if (!active) return;
      if (registration.waiting && navigator.serviceWorker.controller) {
        setUpdateWorker(registration.waiting);
      }
      registration.addEventListener("updatefound", () => {
        const installing = registration.installing;
        installing?.addEventListener("statechange", () => {
          if (installing.state === "installed" && navigator.serviceWorker.controller) {
            setUpdateWorker(registration.waiting ?? installing);
          }
        });
      });
    }).catch(() => undefined);

    return () => {
      active = false;
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  const install = useCallback(async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  }, [installPrompt]);

  const applyUpdate = () => {
    refreshing.current = true;
    updateWorker?.postMessage({ type: "SKIP_WAITING" });
  };

  if (!online) {
    return (
      <div className="pwa-notice offline-notice" role="status">
        <WifiOff />
        <span><strong>You’re offline</strong>Your saved drafts and demo data remain on this device.</span>
      </div>
    );
  }

  if (updateWorker) {
    return (
      <div className="pwa-notice" role="status">
        <RefreshCw />
        <span><strong>A fresh Rhythm update is ready</strong>Refresh when you’re ready to use it.</span>
        <button className="button primary small" type="button" onClick={applyUpdate}>Update</button>
      </div>
    );
  }

  if (installPrompt && !installDismissed) {
    return (
      <div className="pwa-notice install-notice" role="status">
        <Download />
        <span><strong>Install Rhythm</strong>Add it to your device for a focused, app-like experience.</span>
        <button className="button primary small" type="button" onClick={() => void install()}>Install</button>
        <button className="icon-button" type="button" aria-label="Dismiss install suggestion" onClick={() => setInstallDismissed(true)}><X /></button>
      </div>
    );
  }

  return null;
}
