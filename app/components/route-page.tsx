"use client";

import { AppShell } from "./app-shell";
import { AddMenuScreen } from "../screens/add-menu";
import { AuthScreen } from "../screens/auth";
import { DashboardScreen } from "../screens/dashboard";
import { EntryDetailScreen } from "../screens/entry-detail";
import { ExportScreen } from "../screens/export";
import { HistoryScreen } from "../screens/history";
import { InsightsScreen } from "../screens/insights";
import { LandingScreen } from "../screens/landing";
import { CheckInFormScreen, NoteFormScreen, PeeFormScreen, PoopFormScreen, WaterFormScreen } from "../screens/log-forms";
import { OnboardingScreen } from "../screens/onboarding";
import { PrivacyScreen } from "../screens/privacy";
import { SettingsScreen } from "../screens/settings";

export type AppRoute =
  | "landing" | "login" | "register" | "forgot" | "onboarding" | "home"
  | "history" | "add" | "poop" | "pee" | "water" | "note" | "checkin"
  | "entry" | "insights" | "settings" | "privacy" | "export";

export function RoutePage({ route }: { route: AppRoute }) {
  if (route === "landing") return <LandingScreen />;
  if (route === "login" || route === "register" || route === "forgot") return <AuthScreen mode={route} />;
  if (route === "onboarding") return <OnboardingScreen />;
  if (route === "privacy") return <PrivacyScreen />;

  const screen =
    route === "home" ? <DashboardScreen /> :
    route === "history" ? <HistoryScreen /> :
    route === "add" ? <AddMenuScreen /> :
    route === "poop" ? <PoopFormScreen /> :
    route === "pee" ? <PeeFormScreen /> :
    route === "water" ? <WaterFormScreen /> :
    route === "note" ? <NoteFormScreen /> :
    route === "checkin" ? <CheckInFormScreen /> :
    route === "entry" ? <EntryDetailScreen /> :
    route === "insights" ? <InsightsScreen /> :
    route === "settings" ? <SettingsScreen /> :
    <ExportScreen />;

  return <AppShell>{screen}</AppShell>;
}
