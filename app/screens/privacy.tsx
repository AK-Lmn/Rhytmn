"use client";

import { ArrowLeft, BellOff, EyeOff, LockKeyhole, ShieldCheck, UserX } from "lucide-react";
import { Logo } from "../components/logo";

export function PrivacyScreen() {
  return (
    <div className="legal-page">
      <header><Logo /><a href="/settings"><ArrowLeft /> Back to settings</a></header>
      <main>
        <p className="eyebrow">Privacy promise</p>
        <h1>Your body. Your records. Your choice.</h1>
        <p className="lead">Rhythm is designed for personal awareness. It does not create public profiles, social feeds, or public health timelines.</p>
        <section className="privacy-principles">
          <article><LockKeyhole /><h2>User-specific access</h2><p>Firebase rules limit every signed-in user to records inside their own user path. Demo entries stay in local browser storage.</p></article>
          <article><BellOff /><h2>Discreet by default</h2><p>Reminder text is generic and avoids health details in notification previews.</p></article>
          <article><EyeOff /><h2>Shared-space controls</h2><p>Private mode, sensitive-detail hiding, theme controls, and an optional PIN interface reduce casual visibility.</p></article>
          <article><UserX /><h2>No social layer</h2><p>No public profile, followers, feed, or discovery system. Rhythm collects only what supports your tracking.</p></article>
        </section>
        <section className="legal-card"><ShieldCheck /><div><h2>Medical disclaimer</h2><p>Rhythm does not diagnose, predict, or treat medical conditions. Observations are descriptive summaries of the entries you record. They are not proof of cause and do not replace a qualified healthcare professional.</p><p>If symptoms are severe, worsening, persistent, or may be life-threatening, seek appropriate professional or immediate local emergency care.</p></div></section>
        <section className="legal-copy"><h2>Data handling</h2><p>When Firebase is configured, authenticated records are stored in user-specific Firestore collections. Account credentials are handled by Firebase Authentication. Unfinished form drafts and demo-mode changes may be stored locally on your device.</p><h2>Your controls</h2><p>You can export selected categories, delete individual entries, delete all tracking data, sign out, or delete your account from Settings. Account deletion may require a recent sign-in.</p><h2>Minimal collection</h2><p>Rhythm does not ask for diagnoses, legal names, or public identity. Optional notes are always your choice. Firebase configuration and hosting providers may process technical data needed to deliver the service.</p></section>
      </main>
    </div>
  );
}
