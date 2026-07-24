"use client";

import { format, parseISO, subDays } from "date-fns";
import { ArrowLeft, Download, FileText, Printer, ShieldCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { generateInsights, inDateRange } from "../lib/insights";
import { useAppStore } from "../store/app-store";
import type { HealthLog } from "../types";

const categories = ["poop", "pee", "water", "checkin", "note"] as const;
const labels = { poop: "Bowel movements", pee: "Urination", water: "Water & drinks", checkin: "Daily check-ins", note: "Symptoms & notes" };

function csvEscape(value: unknown) {
  const text = Array.isArray(value) ? value.join("; ") : String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

export function ExportScreen() {
  const logs = useAppStore((state) => state.logs);
  const preferences = useAppStore((state) => state.preferences);
  const [from, setFrom] = useState(format(subDays(new Date(), 30), "yyyy-MM-dd"));
  const [to, setTo] = useState(format(new Date(), "yyyy-MM-dd"));
  const [included, setIncluded] = useState<HealthLog["kind"][]>([...categories]);
  const selected = useMemo(() => inDateRange(logs, from, to).filter((log) => included.includes(log.kind)), [from, included, logs, to]);
  const insights = generateInsights(selected, preferences.waterGoalMl);

  const downloadCsv = () => {
    const header = ["type", "date", "time", "summary", "symptoms", "triggers", "notes"];
    const rows = selected.map((log) => [
      log.kind,
      log.date,
      log.time,
      log.kind === "poop" ? `Bristol ${log.bristolType}; ${log.amount}` : log.kind === "pee" ? `Color ${log.color}; ${log.amount}` : log.kind === "water" ? `${log.amountMl} ml ${log.drinkType}` : log.kind === "checkin" ? `Overall ${log.overall}/5` : log.title,
      "symptoms" in log ? log.symptoms : [],
      "triggers" in log ? log.triggers : [],
      log.notes,
    ]);
    const csv = [header, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `rhythm-export-${from}-to-${to}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page export-page">
      <a className="back-link no-print" href="/settings"><ArrowLeft /> Back to settings</a>
      <header className="export-header">
        <div><p className="eyebrow">Private report</p><h1>Rhythm wellness summary</h1><p>{format(parseISO(from), "MMMM d, yyyy")} – {format(parseISO(to), "MMMM d, yyyy")}</p></div>
        <span className="report-logo"><i className="logo-mark"><b /><b /><b /></i>Rhythm</span>
      </header>
      <section className="export-controls no-print card">
        <div className="form-row two"><label>From<input type="date" value={from} onChange={(event) => setFrom(event.target.value)} /></label><label>To<input type="date" value={to} onChange={(event) => setTo(event.target.value)} /></label></div>
        <div><label>Include categories</label><div className="option-chips">{categories.map((kind) => <button key={kind} className={included.includes(kind) ? "selected" : ""} onClick={() => setIncluded((current) => current.includes(kind) ? current.filter((item) => item !== kind) : [...current, kind])}>{labels[kind]}</button>)}</div></div>
        <div className="export-actions"><button className="button primary" onClick={downloadCsv}><Download /> Download CSV</button><button className="button secondary" onClick={() => window.print()}><Printer /> Print / Save as PDF</button></div>
      </section>
      <section className="report-summary">
        <article><strong>{selected.length}</strong><span>Total entries</span></article>
        <article><strong>{selected.filter((log) => log.kind === "poop").length}</strong><span>Bowel logs</span></article>
        <article><strong>{selected.filter((log) => log.kind === "pee").length}</strong><span>Urination logs</span></article>
        <article><strong>{selected.filter((log) => log.kind === "water").reduce((sum, log) => sum + ("amountMl" in log ? log.amountMl : 0), 0).toLocaleString()} ml</strong><span>Drinks logged</span></article>
      </section>
      <section className="report-observations"><h2>Generated observations</h2>{insights.length ? insights.map((insight) => <article key={insight.id}><FileText /><div><strong>{insight.observation}</strong><p>{insight.detail}</p></div></article>) : <p>Not enough selected data for reliable descriptive observations.</p>}</section>
      <section className="report-table"><h2>Entries</h2><table><thead><tr><th>Date & time</th><th>Category</th><th>Details</th><th>Symptoms / notes</th></tr></thead><tbody>{selected.map((log) => <tr key={log.id}><td data-label="Date & time">{format(parseISO(log.date), "MMM d, yyyy")}<small>{log.time}</small></td><td data-label="Category">{labels[log.kind]}</td><td data-label="Details">{log.kind === "poop" ? `Bristol type ${log.bristolType}, ${log.amount}` : log.kind === "pee" ? `Color ${log.color}, ${log.amount}` : log.kind === "water" ? `${log.amountMl} ml ${log.drinkType}` : log.kind === "checkin" ? `Overall ${log.overall}/5, stress ${log.stress}/5` : log.title}</td><td data-label="Symptoms / notes">{"symptoms" in log && log.symptoms.length ? log.symptoms.join(", ") : log.notes || "—"}</td></tr>)}</tbody></table></section>
      <footer className="report-disclaimer"><ShieldCheck /><p><strong>Medical disclaimer:</strong> This report summarizes user-entered information and descriptive observations. It is not a diagnosis, treatment plan, or substitute for professional medical advice.</p></footer>
    </div>
  );
}
