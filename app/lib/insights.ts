import { eachDayOfInterval, format, parseISO, startOfDay, subDays } from "date-fns";
import type { GeneratedInsight, HealthLog, WaterLog } from "../types";

export function inDateRange(logs: HealthLog[], from: string, to: string) {
  const start = startOfDay(parseISO(from)).getTime();
  const end = startOfDay(parseISO(to)).getTime();
  return logs.filter((log) => {
    const time = startOfDay(parseISO(log.date)).getTime();
    return time >= start && time <= end;
  });
}

export function hydrationTotal(logs: HealthLog[], date: string) {
  return Math.round(
    logs
      .filter((log): log is WaterLog => log.kind === "water" && log.date === date)
      .reduce((sum, log) => sum + log.amountMl * log.hydrationFactor, 0),
  );
}

export function calculateStreak(logs: HealthLog[]) {
  const days = new Set(logs.map((log) => log.date));
  let streak = 0;
  for (let cursor = 0; cursor < 365; cursor += 1) {
    const date = format(subDays(new Date(), cursor), "yyyy-MM-dd");
    if (!days.has(date)) {
      if (cursor === 0) continue;
      break;
    }
    streak += 1;
  }
  return streak;
}

export function sevenDaySeries(logs: HealthLog[]) {
  const days = eachDayOfInterval({ start: subDays(new Date(), 6), end: new Date() });
  return days.map((day) => {
    const date = format(day, "yyyy-MM-dd");
    return {
      date,
      label: format(day, "EEE"),
      poop: logs.filter((log) => log.kind === "poop" && log.date === date).length,
      pee: logs.filter((log) => log.kind === "pee" && log.date === date).length,
      hydration: hydrationTotal(logs, date),
    };
  });
}

export function generateInsights(logs: HealthLog[], waterGoal: number): GeneratedInsight[] {
  if (new Set(logs.map((log) => log.date)).size < 4) return [];
  const insights: GeneratedInsight[] = [];
  const poops = logs.filter((log) => log.kind === "poop");
  const waters = sevenDaySeries(logs);

  if (poops.length >= 3) {
    const morning = poops.filter((log) => Number(log.time.slice(0, 2)) < 12).length;
    if (morning / poops.length >= 0.6) {
      insights.push({
        id: "morning-rhythm",
        title: "Morning rhythm",
        observation: "You usually log bowel movements in the morning.",
        detail: `${morning} of your ${poops.length} recent bowel logs were before noon.`,
        tone: "neutral",
      });
    }
  }

  const lowDays = waters.filter((day) => day.hydration > 0 && day.hydration < waterGoal * 0.8).length;
  if (lowDays >= 2) {
    insights.push({
      id: "hydration-low",
      title: "Hydration consistency",
      observation: `Your water intake was lower on ${lowDays} days this week.`,
      detail: "Hydration totals use a simple drink-type factor shown in each water entry.",
      tone: "attention",
    });
  } else {
    insights.push({
      id: "hydration-steady",
      title: "Steady hydration",
      observation: "Your hydration has been fairly consistent this week.",
      detail: "Most recorded days were close to your current goal.",
      tone: "positive",
    });
  }

  const dairyLogs = poops.filter((log) => "triggers" in log && log.triggers.includes("Dairy"));
  const dairyBloating = dairyLogs.filter((log) => "symptoms" in log && log.symptoms.includes("Bloating"));
  if (dairyLogs.length >= 2 && dairyBloating.length / dairyLogs.length >= 0.5) {
    insights.push({
      id: "dairy-bloating",
      title: "Tag overlap",
      observation: "Bloating appeared often on entries tagged with dairy.",
      detail: "This is a descriptive pattern, not a diagnosis or proof of cause.",
      tone: "neutral",
    });
  }

  const brightOnHydrated = logs.filter(
    (log) => log.kind === "pee" && log.color <= 2 && hydrationTotal(logs, log.date) >= waterGoal * 0.8,
  ).length;
  if (brightOnHydrated >= 2) {
    insights.push({
      id: "urine-hydration",
      title: "Color pattern",
      observation: "Your urine logs were generally lighter on higher-water days.",
      detail: "Urine color can vary for many reasons; this only compares your recorded entries.",
      tone: "positive",
    });
  }

  return insights.slice(0, 4);
}
