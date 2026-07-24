"use client";

import { Activity, ArrowRight, ClipboardPlus, Droplets, MessageSquareText, Sparkles, Toilet } from "lucide-react";
import { PageHeader } from "../components/ui";

export function AddMenuScreen() {
  return (
    <div className="page narrow-page">
      <PageHeader eyebrow="Quick add" title="What would you like to log?" intro="Choose an entry type. Most take less than half a minute." />
      <div className="add-menu-grid">
        <a href="/add/bowel" className="add-menu-card amber"><span><Toilet /></span><div><h2>Bowel movement</h2><p>Bristol type, comfort, symptoms, and possible triggers.</p></div><ArrowRight /></a>
        <a href="/add/urination" className="add-menu-card blue"><span><Droplets /></span><div><h2>Urination</h2><p>Hydration color, amount, urgency, and urinary symptoms.</p></div><ArrowRight /></a>
        <a href="/add/water" className="add-menu-card green"><span><Droplets /></span><div><h2>Water or drink</h2><p>Amount, drink type, and transparent hydration credit.</p></div><ArrowRight /></a>
        <a href="/add/note" className="add-menu-card violet"><span><MessageSquareText /></span><div><h2>Symptom or note</h2><p>Capture a feeling, context, or possible lifestyle trigger.</p></div><ArrowRight /></a>
        <a href="/check-in" className="add-menu-card coral"><span><Activity /></span><div><h2>Daily check-in</h2><p>Overall feeling, energy, stress, sleep, and comfort.</p></div><ArrowRight /></a>
      </div>
      <div className="privacy-callout"><ClipboardPlus /><div><strong>A record for you—not a diagnosis.</strong><p>Rhythm describes patterns in what you log. It never claims a condition or replaces professional care.</p></div><Sparkles /></div>
    </div>
  );
}
