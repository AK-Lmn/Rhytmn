import { describe, expect, it } from "vitest";
import { createDemoLogs } from "../app/data/demo";
import { fromFirestoreData, toFirestoreData } from "../app/lib/firestore-mapper";
import { generateInsights, hydrationTotal, inDateRange } from "../app/lib/insights";
import { poopSchema, waterSchema } from "../app/lib/schemas";
import { evaluateSafety } from "../app/lib/safety";
import type { WaterLog } from "../app/types";

describe("form validation", () => {
  it("rejects invalid bowel form values", () => {
    const result = poopSchema.safeParse({
      date: "",
      time: "",
      bristolType: 9,
      amount: "huge",
      color: "",
      ease: 0,
      urgency: 7,
      duration: 0,
      feeling: "",
      severity: 8,
      symptoms: [],
      triggers: [],
      notes: "",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a valid water entry", () => {
    expect(waterSchema.safeParse({ date: "2026-07-24", time: "08:00", amountMl: 350, drinkType: "Water", notes: "" }).success).toBe(true);
  });
});

describe("safety warning logic", () => {
  it("warns deterministically for blood in urine", () => {
    const warning = evaluateSafety({ kind: "pee", symptoms: ["Blood"], severity: 2 });
    expect(warning?.reasons).toContain("blood in urine");
  });

  it("marks inability to urinate as urgent", () => {
    expect(evaluateSafety({ kind: "pee", symptoms: ["Unable to urinate"], severity: 3 })?.level).toBe("urgent");
  });
});

describe("date and hydration calculations", () => {
  it("filters inclusively by date", () => {
    const logs = createDemoLogs();
    const target = logs[0].date;
    expect(inDateRange(logs, target, target).every((log) => log.date === target)).toBe(true);
  });

  it("applies transparent drink hydration factors", () => {
    const log: WaterLog = {
      id: "water-test",
      kind: "water",
      date: "2026-07-24",
      time: "08:00",
      createdAt: "2026-07-24T08:00:00",
      updatedAt: "2026-07-24T08:00:00",
      amountMl: 500,
      drinkType: "Coffee",
      hydrationFactor: 0.8,
    };
    expect(hydrationTotal([log], "2026-07-24")).toBe(400);
  });
});

describe("insight calculations", () => {
  it("requires enough logged days and generates descriptive observations", () => {
    const logs = createDemoLogs();
    const insights = generateInsights(logs, 2200);
    expect(insights.length).toBeGreaterThan(0);
    expect(insights.every((insight) => !/diagnos|disease|condition/i.test(insight.observation))).toBe(true);
  });
});

describe("Firestore mapping", () => {
  it("strips and restores document ids", () => {
    const log = createDemoLogs()[0];
    const data = toFirestoreData(log);
    expect(data.id).toBeUndefined();
    expect(fromFirestoreData(log.id, data)).toEqual(log);
  });
});
