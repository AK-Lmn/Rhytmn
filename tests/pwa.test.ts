import { access, readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import manifest from "../app/manifest";
import { checkBrowserConnectivity } from "../app/lib/connectivity";

describe("PWA installability", () => {
  it("publishes a scoped standalone manifest with required icons", async () => {
    const value = manifest();
    expect(value).toMatchObject({
      name: "Rhythm",
      short_name: "Rhythm",
      start_url: "/home",
      scope: "/",
      display: "standalone",
    });
    const icons = value.icons ?? [];
    expect(icons.some((icon) => icon.sizes === "192x192" && icon.purpose === "any")).toBe(true);
    expect(icons.some((icon) => icon.sizes === "512x512" && icon.purpose === "any")).toBe(true);
    expect(icons.some((icon) => icon.sizes === "512x512" && icon.purpose === "maskable")).toBe(true);
    await Promise.all([
      access("public/icons/icon-192.png"),
      access("public/icons/icon-512.png"),
      access("public/icons/icon-maskable-512.png"),
      access("public/icons/apple-touch-icon.png"),
    ]);
  });

  it("registers the service worker and exposes update handling", async () => {
    const lifecycle = await readFile("app/components/pwa-lifecycle.tsx", "utf8");
    expect(lifecycle).toContain('navigator.serviceWorker.register("/sw.js", { scope: "/" })');
    expect(lifecycle).toContain("beforeinstallprompt");
    expect(lifecycle).toContain("SKIP_WAITING");
    expect(lifecycle).toContain("controllerchange");
  });

  it("derives the offline banner only from browser events and an origin reachability check", async () => {
    const lifecycle = await readFile("app/components/pwa-lifecycle.tsx", "utf8");
    expect(lifecycle).toContain('window.addEventListener("online", onOnline)');
    expect(lifecycle).toContain('window.addEventListener("offline", onOffline)');
    expect(lifecycle).toMatch(
      /const onOnline = \(\) => \{[\s\S]*?setOnline\(true\);[\s\S]*?verifyConnectivity\(false\)/,
    );
    expect(lifecycle).toContain("checkBrowserConnectivity()");
    expect(lifecycle).not.toContain("navigator.onLine");
    expect(lifecycle).not.toMatch(/firebase|firestore|auth/i);
  });

  it("treats any HTTP response as connected and only network failure as offline", async () => {
    const originalWindow = globalThis.window;
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: { setTimeout, clearTimeout },
    });

    try {
      const reachable = async () => new Response(null, { status: 503 });
      const unreachable = async () => {
        throw new TypeError("network unavailable");
      };
      expect(await checkBrowserConnectivity(reachable)).toBe(true);
      expect(await checkBrowserConnectivity(unreachable)).toBe(false);
    } finally {
      Object.defineProperty(globalThis, "window", {
        configurable: true,
        value: originalWindow,
      });
    }
  });

  it("keeps caches limited to an app shell and public static assets", async () => {
    const worker = await readFile("public/sw.js", "utf8");
    expect(worker).toContain('const OFFLINE_FALLBACK = "/offline.html"');
    expect(worker).toContain('request.mode === "navigate"');
    expect(worker).toContain('url.pathname.startsWith("/api/")');
    expect(worker).toContain('request.headers.has("authorization")');
    expect(worker).toContain('url.origin !== self.location.origin');
    expect(worker).not.toMatch(/cache\.put\(event\.request/);
  });
});

describe("critical mobile shell", () => {
  it("keeps the central add action and safe-area-aware navigation", async () => {
    const [shell, css] = await Promise.all([
      readFile("app/components/app-shell.tsx", "utf8"),
      readFile("app/globals.css", "utf8"),
    ]);
    expect(shell).toContain('{ href: "/add", label: "Add", icon: Plus, primary: true }');
    expect(css).toContain("env(safe-area-inset-bottom)");
    expect(css).toContain("min-height: 100dvh");
    expect(css).toContain("@media (max-width: 360px)");
    expect(css).toContain("body:has(input:focus, textarea:focus, select:focus) .bottom-nav");
  });

  it("uses a mobile card layout for exported records", async () => {
    const [screen, css] = await Promise.all([
      readFile("app/screens/export.tsx", "utf8"),
      readFile("app/globals.css", "utf8"),
    ]);
    expect(screen).toContain('data-label="Date & time"');
    expect(css).toContain("content: attr(data-label)");
  });
});
