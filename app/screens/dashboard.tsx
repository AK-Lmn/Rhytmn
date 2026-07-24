"use client";

import { format, formatDistanceToNowStrict } from "date-fns";
import { ArrowRight, BellRing, CalendarDays, Droplets, Plus, Sparkles, Toilet } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { IconBadge, MetricCard, ProgressRing } from "../components/ui";
import { calculateStreak, generateInsights, hydrationTotal, sevenDaySeries } from "../lib/insights";
import { useAppStore } from "../store/app-store";
import type { HealthLog, WaterLog } from "../types";

const ActivityChart = dynamic(
  () => import("../components/charts").then((module) => module.ActivityChart),
  { loading: () => <div className="chart-loading" role="status">Loading activity chart…</div> },
);

const description = (log: HealthLog) => {
  if (log.kind === "poop") return `Bristol type ${log.bristolType} · ${log.amount}`;
  if (log.kind === "pee") return `Color ${log.color} · ${log.amount}`;
  if (log.kind === "water") return `${log.amountMl} ml · ${log.drinkType}`;
  if (log.kind === "checkin") return `Overall ${log.overall}/5 · energy ${log.energy}/5`;
  return log.title;
};

export function DashboardScreen() {
  const logs = useAppStore((state) => state.logs);
  const preferences = useAppStore((state) => state.preferences);
  const profile = useAppStore((state) => state.profile);
  const mode = useAppStore((state) => state.mode);
  const upsertLog = useAppStore((state) => state.upsertLog);
  const showToast = useAppStore((state) => state.showToast);

  if (mode === "anonymous") {
    return (
      <div className="signed-out-state">
        <span className="logo-mark large"><i /><i /><i /></span>
        <h1>Your private dashboard is ready.</h1>
        <p>Sign in to sync across devices, or explore a fully editable fictional demo.</p>
        <div><a className="button primary" href="/login">Sign in</a><Link className="button secondary" href="/">Explore demo</Link></div>
      </div>
    );
  }

  const today = format(new Date(), "yyyy-MM-dd");
  const todayLogs = logs.filter((log) => log.date === today);
  const poops = todayLogs.filter((log) => log.kind === "poop");
  const pees = todayLogs.filter((log) => log.kind === "pee");
  const water = hydrationTotal(logs, today);
  const recent = logs.slice(0, 5);
  const lastPoop = logs.find((log) => log.kind === "poop");
  const lastPee = logs.find((log) => log.kind === "pee");
  const series = sevenDaySeries(logs);
  const insight = generateInsights(logs, preferences.waterGoalMl)[0];
  const firstName = profile?.preferredName || preferences.preferredName || "there";

  const quickWater = async (amountMl: number) => {
    const now = new Date();
    const log: WaterLog = {
      id: crypto.randomUUID(),
      kind: "water",
      date: format(now, "yyyy-MM-dd"),
      time: format(now, "HH:mm"),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      amountMl,
      drinkType: "Water",
      hydrationFactor: 1,
      notes: "",
      demo: mode === "demo",
    };
    upsertLog(log);
    if (profile && mode === "firebase") {
      const { saveRemoteLog } = await import("../lib/firestore-service");
      await saveRemoteLog(profile.uid, log);
    }
    showToast(`${amountMl} ml added`);
  };

  return (
    <div className="page dashboard-page">
      <header className="dashboard-hello">
        <div><p>{format(new Date(), "EEEE, MMMM d")}</p><h1>Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}, {firstName}</h1><span>How is your rhythm feeling today?</span></div>
        <a className="avatar" href="/settings" aria-label="Open profile settings">{firstName.slice(0, 1).toUpperCase()}</a>
      </header>

      {mode === "demo" && <div className="demo-banner"><Sparkles /> You’re exploring fictional demo data. Everything is editable, and changes stay on this device.<button onClick={() => showToast("Demo mode keeps your edits private on this device.")}>Learn more</button></div>}

      <section className="quick-grid" aria-label="Quick log actions">
        <a href="/add/bowel" className="quick-card amber"><span><Toilet /></span><div><strong>Log bowel movement</strong><small>About 20 seconds</small></div><Plus /></a>
        <a href="/add/urination" className="quick-card blue"><span><Droplets /></span><div><strong>Log urination</strong><small>Quick hydration check</small></div><Plus /></a>
        <div className="quick-card green water-quick"><span><Droplets /></span><div><strong>Add water</strong><small>Tap a usual amount</small><div className="inline-add"><button onClick={() => void quickWater(250)}>+250</button><button onClick={() => void quickWater(350)}>+350</button><a href="/add/water">Other</a></div></div></div>
      </section>

      <section className="metric-grid">
        <MetricCard label="Bowel movements" value={poops.length} detail={lastPoop ? `Last ${formatDistanceToNowStrict(new Date(`${lastPoop.date}T${lastPoop.time}`))} ago` : "No entries yet"} tone="amber" />
        <MetricCard label="Urination" value={pees.length} detail={lastPee ? `Last ${formatDistanceToNowStrict(new Date(`${lastPee.date}T${lastPee.time}`))} ago` : "No entries yet"} tone="blue" />
        <MetricCard label="Current streak" value={`${calculateStreak(logs)} days`} detail="A log of any kind counts" tone="violet" />
      </section>

      <section className="dashboard-grid">
        <article className="card hydration-card">
          <div className="card-heading"><div><p className="eyebrow">Hydration</p><h2>Today’s flow</h2></div><a href="/add/water">View details <ArrowRight /></a></div>
          <div className="hydration-main">
            <ProgressRing value={water} goal={preferences.waterGoalMl} />
            <div><strong>{water.toLocaleString()} <small>ml</small></strong><span>of {preferences.waterGoalMl.toLocaleString()} ml goal</span><div className="hydration-bar"><i style={{ width: `${Math.min(100, water / preferences.waterGoalMl * 100)}%` }} /></div><p>{water >= preferences.waterGoalMl ? "Goal reached—nice steady care." : `${Math.max(0, preferences.waterGoalMl - water).toLocaleString()} ml to your goal`}</p></div>
          </div>
        </article>

        <article className="card checkin-card">
          <div className="card-heading"><div><p className="eyebrow">Daily check-in</p><h2>How are you feeling?</h2></div><CalendarDays /></div>
          <div className="feeling-row">{["Rough", "Low", "Okay", "Good", "Great"].map((feeling, index) => <a key={feeling} href={`/check-in?overall=${index + 1}`}><span>{["−−", "−", "○", "+", "++"][index]}</span>{feeling}</a>)}</div>
          <a className="button secondary full" href="/check-in">Open full check-in</a>
        </article>

        <article className="card activity-card">
          <div className="card-heading"><div><p className="eyebrow">Seven-day activity</p><h2>Your recent rhythm</h2></div><div className="legend"><span><i className="amber" />Bowel</span><span><i className="blue" />Urination</span></div></div>
          <ActivityChart data={series} />
        </article>

        <article className="card insight-card">
          <span className="insight-spark"><Sparkles /></span>
          <p className="eyebrow">Pattern observation</p>
          <h2>{insight?.title ?? "Keep building your picture"}</h2>
          <p>{insight?.observation ?? "Log on four different days and Rhythm will begin showing gentle, descriptive observations."}</p>
          <small>{insight?.detail ?? "Patterns are never diagnoses."}</small>
          <a href="/insights">See all observations <ArrowRight /></a>
        </article>
      </section>

      <section className="card recent-card">
        <div className="card-heading"><div><p className="eyebrow">Recent entries</p><h2>Your latest logs</h2></div><a href="/history">Full history <ArrowRight /></a></div>
        <div className="timeline-list">
          {recent.map((log) => (
            <a href={`/entry/${log.id}`} className="timeline-row" key={log.id}>
              <IconBadge kind={log.kind} />
              <div><strong>{log.kind === "poop" ? "Bowel movement" : log.kind === "pee" ? "Urination" : log.kind === "water" ? "Hydration" : "Daily check-in"}</strong><span>{description(log)}</span></div>
              <time>{log.date === today ? "Today" : format(new Date(`${log.date}T00:00:00`), "MMM d")}<small>{format(new Date(`${log.date}T${log.time}:00`), "h:mm a")}</small></time>
              <ArrowRight />
            </a>
          ))}
        </div>
      </section>

      <section className="reminder-card">
        <span><BellRing /></span><div><strong>Gentle evening check-in</strong><p>{preferences.reminders ? `A discreet reminder is set for ${format(new Date(`2000-01-01T${preferences.reminderTime}`), "h:mm a")}.` : "Reminders are currently off."}</p></div><a className="button secondary" href="/settings">Adjust</a>
      </section>
    </div>
  );
}
