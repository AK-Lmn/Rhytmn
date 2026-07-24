import type { HealthLog, SafetyWarning } from "../types";

type Candidate = {
  kind: "poop" | "pee" | "note";
  symptoms?: string[];
  severity?: number;
  color?: string | number;
  amount?: string;
};

export function evaluateSafety(candidate: Candidate, recent: HealthLog[] = []): SafetyWarning | null {
  const symptoms = candidate.symptoms ?? [];
  const reasons: string[] = [];
  let urgent = false;

  if (symptoms.includes("Blood")) reasons.push(candidate.kind === "pee" ? "blood in urine" : "blood in stool");
  if (candidate.kind === "poop" && typeof candidate.color === "string" && /black|tarry/i.test(candidate.color)) {
    reasons.push("black or tar-like stool");
  }
  if (symptoms.includes("Unable to urinate")) {
    reasons.push("inability to urinate");
    urgent = true;
  }
  if (symptoms.includes("Severe dehydration")) reasons.push("possible severe dehydration signs");
  if (symptoms.includes("Persistent vomiting")) reasons.push("persistent vomiting");
  if ((candidate.severity ?? 0) >= 4 || (symptoms.includes("Pain") && (candidate.severity ?? 0) >= 3)) {
    reasons.push("severe pain");
  }

  const repeatingDays = new Set(
    recent
      .filter((log) => "symptoms" in log && log.symptoms.some((symptom) => symptoms.includes(symptom)))
      .map((log) => log.date),
  );
  if (symptoms.length > 0 && repeatingDays.size >= 3) reasons.push("similar symptoms across several days");
  if (reasons.length === 0) return null;

  return {
    id: `warning-${Date.now()}`,
    level: urgent ? "urgent" : "attention",
    title: urgent ? "Please consider urgent care" : "A gentle safety note",
    message:
      "Some symptoms you selected may need medical attention. Consider contacting a qualified healthcare professional, especially if symptoms are severe, worsening, or persistent.",
    reasons,
  };
}
