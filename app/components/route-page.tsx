"use client";

import dynamic from "next/dynamic";
import { AppShell } from "./app-shell";

const LandingScreen = dynamic(() => import("../screens/landing").then((module) => module.LandingScreen));
const AuthScreen = dynamic(() => import("../screens/auth").then((module) => module.AuthScreen));
const OnboardingScreen = dynamic(() => import("../screens/onboarding").then((module) => module.OnboardingScreen));
const PrivacyScreen = dynamic(() => import("../screens/privacy").then((module) => module.PrivacyScreen));
const DashboardScreen = dynamic(() => import("../screens/dashboard").then((module) => module.DashboardScreen));
const HistoryScreen = dynamic(() => import("../screens/history").then((module) => module.HistoryScreen));
const AddMenuScreen = dynamic(() => import("../screens/add-menu").then((module) => module.AddMenuScreen));
const PoopFormScreen = dynamic(() => import("../screens/log-forms").then((module) => module.PoopFormScreen));
const PeeFormScreen = dynamic(() => import("../screens/log-forms").then((module) => module.PeeFormScreen));
const WaterFormScreen = dynamic(() => import("../screens/log-forms").then((module) => module.WaterFormScreen));
const NoteFormScreen = dynamic(() => import("../screens/log-forms").then((module) => module.NoteFormScreen));
const CheckInFormScreen = dynamic(() => import("../screens/log-forms").then((module) => module.CheckInFormScreen));
const EntryDetailScreen = dynamic(() => import("../screens/entry-detail").then((module) => module.EntryDetailScreen));
const InsightsScreen = dynamic(() => import("../screens/insights").then((module) => module.InsightsScreen));
const SettingsScreen = dynamic(() => import("../screens/settings").then((module) => module.SettingsScreen));
const ExportScreen = dynamic(() => import("../screens/export").then((module) => module.ExportScreen));

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
