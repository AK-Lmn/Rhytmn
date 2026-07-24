"use client";

import { format, parseISO } from "date-fns";
import { ArrowLeft, Edit3, Trash2 } from "lucide-react";
import { useState } from "react";
import { ConfirmDialog, IconBadge } from "../components/ui";
import { deleteRemoteLog } from "../lib/firestore-service";
import { useAppStore } from "../store/app-store";
import type { HealthLog } from "../types";

const title = (log: HealthLog) => log.kind === "poop" ? "Bowel movement" : log.kind === "pee" ? "Urination" : log.kind === "water" ? "Water / drink" : log.kind === "checkin" ? "Daily check-in" : "Symptom note";

export function EntryDetailScreen() {
  const logs = useAppStore((state) => state.logs);
  const [confirm, setConfirm] = useState(false);
  const id = typeof window === "undefined" ? "" : window.location.pathname.split("/").filter(Boolean).pop() ?? "";
  const log = logs.find((item) => item.id === id);
  if (!log) return <div className="page detail-page"><a className="back-link" href="/history"><ArrowLeft /> History</a><div className="empty-state compact"><h1>Entry not found</h1><p>It may have been deleted or belongs to another account.</p><a className="button primary" href="/history">Return to history</a></div></div>;

  const rows: Array<[string, string | number | boolean | string[] | undefined]> =
    log.kind === "poop" ? [
      ["Bristol type", log.bristolType], ["Amount", log.amount], ["Color", log.color], ["Ease", `${log.ease}/5`], ["Urgency", `${log.urgency}/5`], ["Duration", `${log.duration} minutes`], ["Feeling afterward", log.feeling], ["Symptoms", log.symptoms], ["Possible triggers", log.triggers], ["Severity", `${log.severity}/4`],
    ] : log.kind === "pee" ? [
      ["Hydration color", log.color], ["Amount", log.amount], ["Urgency", `${log.urgency}/5`], ["Stream strength", `${log.stream}/5`], ["Complete emptying", log.complete ? "Yes" : "No"], ["Symptoms", log.symptoms], ["Drinks beforehand", log.drinks], ["Medication note", log.medication], ["Severity", `${log.severity}/4`],
    ] : log.kind === "water" ? [
      ["Amount", `${log.amountMl} ml`], ["Drink", log.drinkType], ["Hydration credit", `${Math.round(log.amountMl * log.hydrationFactor)} ml (${Math.round(log.hydrationFactor * 100)}%)`],
    ] : log.kind === "checkin" ? [
      ["Overall feeling", `${log.overall}/5`], ["Energy", `${log.energy}/5`], ["Stress", `${log.stress}/5`], ["Sleep", `${log.sleep}/5`], ["Bloating", `${log.bloating}/5`], ["Abdominal discomfort", `${log.discomfort}/5`],
    ] : [
      ["Title", log.title], ["Symptoms", log.symptoms], ["Possible triggers", log.triggers], ["Severity", `${log.severity}/4`],
    ];

  const editRoute = log.kind === "poop" ? "/add/bowel" : log.kind === "pee" ? "/add/urination" : log.kind === "water" ? "/add/water" : log.kind === "checkin" ? "/check-in" : "/add/note";
  const remove = async () => {
    const state = useAppStore.getState();
    state.deleteLog(log.id);
    if (state.profile && state.mode === "firebase") await deleteRemoteLog(state.profile.uid, log);
    state.showToast("Entry deleted");
    window.location.assign("/history");
  };

  return (
    <div className="page detail-page">
      <a className="back-link" href="/history"><ArrowLeft /> Back to history</a>
      <article className="detail-card card">
        <header><IconBadge kind={log.kind} /><div><p className="eyebrow">{format(parseISO(log.date), "EEEE, MMMM d, yyyy")} · {format(new Date(`${log.date}T${log.time}:00`), "h:mm a")}</p><h1>{title(log)}</h1>{log.demo && <span className="demo-badge inline">Fictional demo entry</span>}</div><div className="detail-actions"><a className="button secondary" href={`${editRoute}?id=${log.id}`}><Edit3 /> Edit</a><button className="button danger-text" onClick={() => setConfirm(true)}><Trash2 /> Delete</button></div></header>
        <section className="detail-grid">{rows.filter(([, value]) => Array.isArray(value) ? value.length : value !== undefined && value !== "").map(([label, value]) => <div key={label}><span>{label}</span><strong>{Array.isArray(value) ? value.join(", ") : String(value)}</strong></div>)}</section>
        {log.notes && <section className="detail-note"><span>Notes</span><p>{log.notes}</p></section>}
        <footer><p>Rhythm stores descriptive observations only. This entry is not a diagnosis or medical advice.</p></footer>
      </article>
      <ConfirmDialog open={confirm} title="Delete this entry?" text="This action can’t be undone." confirmLabel="Delete entry" danger onCancel={() => setConfirm(false)} onConfirm={() => void remove()} />
    </div>
  );
}
