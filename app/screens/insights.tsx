"use client";

import { differenceInCalendarDays, format, parseISO, subDays } from "date-fns";
import { Activity, ArrowDownRight, ArrowUpRight, CalendarCheck, Droplets, Info, Sparkles, TrendingUp } from "lucide-react";
import dynamic from "next/dynamic";
import { EmptyState, PageHeader } from "../components/ui";
import { BRISTOL_TYPES } from "../lib/constants";
import { calculateStreak, generateInsights, sevenDaySeries } from "../lib/insights";
import { useAppStore } from "../store/app-store";

const HydrationChart = dynamic(
  () => import("../components/charts").then((module) => module.HydrationChart),
  { loading: () => <div className="chart-loading" role="status">Loading hydration chart…</div> },
);
const BristolDistribution = dynamic(
  () => import("../components/charts").then((module) => module.BristolDistribution),
  { loading: () => <div className="chart-loading" role="status">Loading distribution chart…</div> },
);

function frequency(list: string[]) {
  const counts = list.reduce<Record<string, number>>((result, item) => ({ ...result, [item]: (result[item] ?? 0) + 1 }), {});
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}

export function InsightsScreen() {
  const logs = useAppStore((state) => state.logs);
  const preferences = useAppStore((state) => state.preferences);
  const loggedDays = new Set(logs.map((log) => log.date)).size;
  if (loggedDays < 4) {
    return <div className="page insights-page"><PageHeader eyebrow="Patterns, not diagnoses" title="Insights" intro="Friendly observations drawn only from what you record." /><EmptyState title="A little more rhythm first" text="Log on at least four different days to unlock meaningful observations and comparisons." action="Add an entry" /></div>;
  }

  const poops = logs.filter((log) => log.kind === "poop");
  const pees = logs.filter((log) => log.kind === "pee");
  const avgBristol = poops.length ? poops.reduce((sum, log) => sum + ("bristolType" in log ? log.bristolType : 0), 0) / poops.length : 0;
  const avgPee = pees.length ? pees.reduce((sum, log) => sum + ("color" in log ? Number(log.color) : 0), 0) / pees.length : 0;
  const symptoms = frequency(logs.flatMap((log) => "symptoms" in log ? log.symptoms : []));
  const triggers = frequency(logs.flatMap((log) => "triggers" in log ? log.triggers : []));
  const observations = generateInsights(logs, preferences.waterGoalMl);
  const series = sevenDaySeries(logs);
  const stoolDistribution = BRISTOL_TYPES.map((type) => ({ type: `Type ${type.value}`, value: poops.filter((log) => "bristolType" in log && log.bristolType === type.value).length })).filter((item) => item.value);
  const constipation = poops.filter((log) => "bristolType" in log && log.bristolType <= 2).length;
  const diarrhea = poops.filter((log) => "bristolType" in log && log.bristolType >= 6).length;
  const earliest = logs.at(-1)?.date ?? format(new Date(), "yyyy-MM-dd");
  const span = Math.max(1, differenceInCalendarDays(new Date(), parseISO(earliest)) + 1);
  const currentWeek = logs.filter((log) => log.date >= format(subDays(new Date(), 6), "yyyy-MM-dd")).length;
  const previousWeek = logs.filter((log) => log.date >= format(subDays(new Date(), 13), "yyyy-MM-dd") && log.date < format(subDays(new Date(), 6), "yyyy-MM-dd")).length;

  return (
    <div className="page insights-page">
      <PageHeader eyebrow="Patterns, not diagnoses" title="Insights" intro="Friendly observations drawn only from what you record." actions={<a className="button secondary" href="/export">Export report</a>} />
      <div className="insights-disclaimer"><Info /><p><strong>For personal awareness</strong>These are descriptive patterns, not diagnoses, predictions, or treatment advice.</p></div>

      <section className="insight-stats">
        <article><span><CalendarCheck /></span><strong>{loggedDays}</strong><p>logged days</p><small>across {span} calendar days</small></article>
        <article><span><TrendingUp /></span><strong>{calculateStreak(logs)}</strong><p>day streak</p><small>any entry counts</small></article>
        <article><span><Activity /></span><strong>{avgBristol ? avgBristol.toFixed(1) : "—"}</strong><p>average Bristol type</p><small>{poops.length} bowel logs</small></article>
        <article><span><Droplets /></span><strong>{avgPee ? avgPee.toFixed(1) : "—"}</strong><p>average urine color</p><small>{pees.length} urine logs</small></article>
      </section>

      <section className="observations-grid">
        {observations.map((insight) => <article className={`observation-card ${insight.tone}`} key={insight.id}><span><Sparkles /></span><p className="eyebrow">Observation</p><h2>{insight.title}</h2><strong>{insight.observation}</strong><p>{insight.detail}</p></article>)}
      </section>

      <section className="insights-grid">
        <article className="card">
          <div className="card-heading"><div><p className="eyebrow">Hydration</p><h2>Seven-day consistency</h2></div><Droplets /></div>
          <HydrationChart data={series} goal={preferences.waterGoalMl} />
          <div className="chart-foot"><span>Goal: {preferences.waterGoalMl.toLocaleString()} ml</span><small>Drink-type factors are included.</small></div>
        </article>
        <article className="card">
          <div className="card-heading"><div><p className="eyebrow">Bowel patterns</p><h2>Stool type distribution</h2></div><span className="metric-pill">Avg {avgBristol.toFixed(1)}</span></div>
          {stoolDistribution.length ? <BristolDistribution data={stoolDistribution} /> : <EmptyState title="No bowel logs yet" text="Add bowel entries to see a distribution." />}
          <div className="trend-pairs"><span><i className="amber" /><strong>{constipation}</strong> firm / constipation-pattern logs</span><span><i className="coral" /><strong>{diarrhea}</strong> loose / diarrhea-pattern logs</span></div>
        </article>
        <article className="card ranked-card">
          <div className="card-heading"><div><p className="eyebrow">Common tags</p><h2>Symptoms & triggers</h2></div></div>
          <div className="rank-columns">
            <div><h3>Symptoms</h3>{symptoms.slice(0, 5).map(([item, count], index) => <div key={item}><span>{index + 1}. {item}</span><i><b style={{ width: `${count / symptoms[0][1] * 100}%` }} /></i><strong>{count}</strong></div>)}{!symptoms.length && <p>No symptoms tagged.</p>}</div>
            <div><h3>Possible triggers</h3>{triggers.slice(0, 5).map(([item, count], index) => <div key={item}><span>{index + 1}. {item}</span><i><b style={{ width: `${count / triggers[0][1] * 100}%` }} /></i><strong>{count}</strong></div>)}{!triggers.length && <p>No triggers tagged.</p>}</div>
          </div>
        </article>
        <article className="card compare-card">
          <div className="card-heading"><div><p className="eyebrow">Weekly comparison</p><h2>Logging activity</h2></div>{currentWeek >= previousWeek ? <ArrowUpRight /> : <ArrowDownRight />}</div>
          <div className="compare-number"><strong>{currentWeek}</strong><span>entries this week</span></div>
          <div className="compare-bars"><span><label>This week</label><i><b style={{ width: `${Math.min(100, currentWeek / Math.max(currentWeek, previousWeek, 1) * 100)}%` }} /></i></span><span><label>Previous</label><i><b style={{ width: `${Math.min(100, previousWeek / Math.max(currentWeek, previousWeek, 1) * 100)}%` }} /></i></span></div>
          <p>{currentWeek === previousWeek ? "Your logging volume is steady week to week." : `You logged ${Math.abs(currentWeek - previousWeek)} ${currentWeek > previousWeek ? "more" : "fewer"} entries than the previous week.`}</p>
        </article>
      </section>
    </div>
  );
}
