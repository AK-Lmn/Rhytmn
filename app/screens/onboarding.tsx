"use client";

import { BellRing, Check, Droplets, Palette, Sparkles } from "lucide-react";
import { useState } from "react";
import { saveProfile } from "../lib/firestore-service";
import { useAppStore } from "../store/app-store";

export function OnboardingScreen() {
  const profile = useAppStore((state) => state.profile);
  const preferences = useAppStore((state) => state.preferences);
  const setPreferences = useAppStore((state) => state.setPreferences);
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState(preferences);

  const finish = async () => {
    setPreferences(draft);
    if (profile && !profile.demo) await saveProfile(profile.uid, { ...profile, preferredName: draft.preferredName }, draft);
    window.location.href = "/home";
  };

  return (
    <div className="onboarding-page">
      <header><span className="logo-mark"><i /><i /><i /></span><strong>Rhythm</strong><span>Step {step} of 3</span></header>
      <main className="onboarding-card">
        <div className="step-dots">{[1, 2, 3].map((item) => <i key={item} className={item <= step ? "active" : ""} />)}</div>
        {step === 1 && (
          <>
            <span className="onboarding-icon"><Sparkles /></span>
            <p className="eyebrow">Make it yours</p>
            <h1>How should Rhythm greet you?</h1>
            <p>Only a preferred name is needed. You can change this anytime.</p>
            <label>Preferred name<input value={draft.preferredName} onChange={(event) => setDraft({ ...draft, preferredName: event.target.value })} /></label>
            <label>Main tracking goal<select value={draft.trackingGoal} onChange={(event) => setDraft({ ...draft, trackingGoal: event.target.value })}><option>Understand my daily rhythm</option><option>Stay consistent with hydration</option><option>Prepare notes for an appointment</option><option>Track digestive comfort</option></select></label>
          </>
        )}
        {step === 2 && (
          <>
            <span className="onboarding-icon blue"><Droplets /></span>
            <p className="eyebrow">Daily hydration</p>
            <h1>Set a gentle water goal</h1>
            <p>This is a tracking target, not medical guidance.</p>
            <div className="goal-picker">
              {[1600, 2000, 2200, 2600].map((amount) => <button key={amount} className={draft.waterGoalMl === amount ? "selected" : ""} onClick={() => setDraft({ ...draft, waterGoalMl: amount })}>{amount.toLocaleString()} ml</button>)}
            </div>
            <label>Custom goal<input type="number" min={500} step={100} value={draft.waterGoalMl} onChange={(event) => setDraft({ ...draft, waterGoalMl: Number(event.target.value) })} /></label>
          </>
        )}
        {step === 3 && (
          <>
            <span className="onboarding-icon green"><Palette /></span>
            <p className="eyebrow">Comfort & privacy</p>
            <h1>Choose what feels right</h1>
            <div className="setting-choice">
              <BellRing /><span><strong>Gentle reminders</strong><small>Use discreet “Time for a quick check-in” wording.</small></span><input type="checkbox" checked={draft.reminders} onChange={(event) => setDraft({ ...draft, reminders: event.target.checked })} />
            </div>
            <label>Theme<select value={draft.theme} onChange={(event) => setDraft({ ...draft, theme: event.target.value as typeof draft.theme })}><option value="system">Match my device</option><option value="light">Light</option><option value="dark">Dark</option></select></label>
            <div className="privacy-copy"><Check /> Rhythm never creates a public profile or social feed.</div>
          </>
        )}
        <div className="onboarding-actions">
          {step > 1 && <button className="button ghost" onClick={() => setStep((value) => value - 1)}>Back</button>}
          <button className="button primary" onClick={() => step < 3 ? setStep((value) => value + 1) : void finish()}>{step === 3 ? "Open my dashboard" : "Continue"}</button>
        </div>
      </main>
    </div>
  );
}
