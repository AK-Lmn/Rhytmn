"use client";

import { deleteUser, signOut } from "firebase/auth";
import { BellRing, ChevronRight, Database, LogOut, Moon, Palette, ShieldCheck, Sun, Trash2, UserRound } from "lucide-react";
import { useState } from "react";
import { ConfirmDialog, PageHeader } from "../components/ui";
import { auth } from "../lib/firebase";
import { deleteAllRemoteData, saveProfile } from "../lib/firestore-service";
import { selectDisplayName, useAppStore } from "../store/app-store";
import type { Preferences } from "../types";

export function SettingsScreen() {
  const profile = useAppStore((state) => state.profile);
  const mode = useAppStore((state) => state.mode);
  const accountStatus = useAppStore((state) => state.accountStatus);
  const preferences = useAppStore((state) => state.preferences);
  const displayName = useAppStore(selectDisplayName);
  const setPreferences = useAppStore((state) => state.setPreferences);
  const showToast = useAppStore((state) => state.showToast);
  const [confirm, setConfirm] = useState<"data" | "account" | null>(null);

  const update = async (patch: Partial<Preferences>) => {
    setPreferences(patch);
    const state = useAppStore.getState();
    const next = state.preferences;
    if (state.profile && state.mode === "firebase" && state.accountStatus === "ready") {
      await saveProfile(
        state.profile.uid,
        { ...state.profile, preferredName: next.preferredName },
        next,
      );
    }
    showToast("Settings saved");
  };
  const logout = async () => {
    if (auth && mode === "firebase") await signOut(auth);
    useAppStore.getState().resetSession();
    window.location.href = "/";
  };
  const clearData = async () => {
    if (profile && mode === "firebase") await deleteAllRemoteData(profile.uid);
    useAppStore.getState().clearLogs();
    setConfirm(null);
    showToast("All tracking data deleted");
  };
  const removeAccount = async () => {
    if (profile && mode === "firebase") await deleteAllRemoteData(profile.uid);
    if (auth?.currentUser) await deleteUser(auth.currentUser);
    useAppStore.getState().resetSession();
    window.location.href = "/";
  };

  return (
    <div className="page settings-page">
      <PageHeader eyebrow="Your preferences" title="Settings" intro="Control your profile, privacy, reminders, and data." />
      <section className="settings-grid">
        <div className="settings-main">
          <article className="settings-card card">
            <div className="settings-title"><span><UserRound /></span><div><h2>Profile</h2><p>Only what Rhythm needs to personalize your space.</p></div></div>
            <label>Preferred name<input value={displayName} onChange={(event) => setPreferences({ preferredName: event.target.value })} onBlur={() => void update({ preferredName: displayName })} /></label>
            <label>Email<input value={profile?.email ?? (mode === "demo" ? "demo@rhythm.local" : "")} disabled /></label>
            {mode === "demo" && <div className="setup-note">This is a fictional demo profile. No account exists.</div>}
          </article>

          <article className="settings-card card">
            <div className="settings-title"><span><DropletsIcon /></span><div><h2>Hydration goal</h2><p>Used for progress and descriptive comparisons.</p></div></div>
            <div className="unit-input"><input type="number" min={500} step={100} value={preferences.waterGoalMl} onChange={(event) => setPreferences({ waterGoalMl: Number(event.target.value) })} onBlur={() => void update({ waterGoalMl: preferences.waterGoalMl })} /><span>ml per day</span></div>
          </article>

          <article className="settings-card card">
            <div className="settings-title"><span><Palette /></span><div><h2>Appearance</h2><p>Choose a comfortable theme.</p></div></div>
            <div className="theme-picker">
              {([{ key: "light", label: "Light", icon: Sun }, { key: "dark", label: "Dark", icon: Moon }, { key: "system", label: "System", icon: Palette }] as const).map((theme) => <button key={theme.key} className={preferences.theme === theme.key ? "selected" : ""} onClick={() => void update({ theme: theme.key })}><theme.icon />{theme.label}</button>)}
            </div>
          </article>

          <article className="settings-card card">
            <div className="settings-title"><span><BellRing /></span><div><h2>Reminders</h2><p>Rhythm uses generic wording in previews.</p></div></div>
            <label className="toggle-row"><span><strong>Daily reminder</strong><small>“Time for a quick check-in.”</small></span><input type="checkbox" checked={preferences.reminders} onChange={(event) => void update({ reminders: event.target.checked })} /></label>
            <label>Reminder time<input type="time" value={preferences.reminderTime} onChange={(event) => void update({ reminderTime: event.target.value })} disabled={!preferences.reminders} /></label>
            <label className="toggle-row"><span><strong>Discreet notification text</strong><small>Never show health details in previews.</small></span><input type="checkbox" checked={preferences.discreetNotifications} onChange={(event) => void update({ discreetNotifications: event.target.checked })} /></label>
          </article>

          <article className="settings-card card">
            <div className="settings-title"><span><Database /></span><div><h2>Format & units</h2><p>Control how your records appear.</p></div></div>
            <div className="form-row two"><label>Week starts<select value={preferences.weekStartsOn} onChange={(event) => void update({ weekStartsOn: Number(event.target.value) as 0 | 1 })}><option value={1}>Monday</option><option value={0}>Sunday</option></select></label><label>Date format<select value={preferences.dateFormat} onChange={(event) => void update({ dateFormat: event.target.value as Preferences["dateFormat"] })}><option value="MMM d, yyyy">Jul 24, 2026</option><option value="dd/MM/yyyy">24/07/2026</option><option value="MM/dd/yyyy">07/24/2026</option></select></label></div>
            <label>Measurement units<select value={preferences.units} onChange={(event) => void update({ units: event.target.value as Preferences["units"] })}><option value="metric">Metric (ml)</option><option value="imperial">Imperial (fl oz)</option></select></label>
          </article>
        </div>

        <aside className="settings-side">
          <article className="card account-card"><span className="avatar large">{displayName.slice(0, 1).toUpperCase()}</span><h2>{displayName}</h2><p>{mode === "demo" ? "Demo explorer" : profile?.email}</p><span className="account-status"><i /> {mode === "firebase" && accountStatus === "ready" ? "Firebase sync active" : "Private device demo"}</span></article>
          <article className="card side-links"><a href="/privacy"><ShieldCheck /> Privacy & disclaimer <ChevronRight /></a></article>
          <article className="card danger-zone"><h2>Data controls</h2><button onClick={() => setConfirm("data")}><Trash2 /> Delete all tracking data</button>{mode === "firebase" && <button onClick={() => setConfirm("account")}><UserRound /> Delete account</button>}<button onClick={() => void logout()}><LogOut /> Log out</button></article>
          <p className="version">Rhythm v1.0.0 · Built for private awareness</p>
        </aside>
      </section>
      <ConfirmDialog open={confirm === "data"} title="Delete all tracking data?" text="Every bowel, urination, water, check-in, and note entry will be permanently removed." confirmLabel="Delete all data" danger onCancel={() => setConfirm(null)} onConfirm={() => void clearData()} />
      <ConfirmDialog open={confirm === "account"} title="Delete your account?" text="Your records and Firebase account will be permanently removed. A recent sign-in may be required." confirmLabel="Delete account" danger onCancel={() => setConfirm(null)} onConfirm={() => void removeAccount()} />
    </div>
  );
}

function DropletsIcon() {
  return <Database />;
}
