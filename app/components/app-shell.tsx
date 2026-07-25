"use client";

import {
  BarChart3,
  CalendarDays,
  Home,
  LockKeyhole,
  Plus,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { Logo } from "./logo";
import { Toast } from "./ui";
import { useAppStore } from "../store/app-store";

const nav = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/history", label: "History", icon: CalendarDays },
  { href: "/add", label: "Add", icon: Plus, primary: true },
  { href: "/insights", label: "Insights", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const mode = useAppStore((state) => state.mode);

  return (
    <div className="app-frame">
      <aside className="sidebar">
        <Logo />
        <nav aria-label="Main navigation">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== "/home" && pathname.startsWith(item.href));
            return (
              <a key={item.href} href={item.href} className={`${active ? "active" : ""} ${item.primary ? "nav-add" : ""}`}>
                <Icon size={20} />
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>
        <div className="privacy-promise">
          <ShieldCheck size={21} />
          <div><strong>Your space is private</strong><span>No social feed. No public profile.</span></div>
        </div>
        {mode === "demo" && <div className="demo-badge">Demo data · edits stay on this device</div>}
      </aside>

      <div className="mobile-topbar">
        <Logo />
        <a className="mobile-topbar-lock" href="/privacy" aria-label="Privacy settings"><LockKeyhole size={20} /></a>
      </div>

      <main>{children}</main>

      <nav className="bottom-nav" aria-label="Main navigation">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || (item.href !== "/home" && pathname.startsWith(item.href));
          return (
            <a key={item.href} href={item.href} className={`${active ? "active" : ""} ${item.primary ? "nav-add" : ""}`} aria-label={item.label}>
              <Icon size={item.primary ? 25 : 21} />
              <span>{item.label}</span>
            </a>
          );
        })}
      </nav>
      <Toast />
    </div>
  );
}
