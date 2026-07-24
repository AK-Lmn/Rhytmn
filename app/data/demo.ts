import { format, subDays } from "date-fns";
import type { HealthLog } from "../types";

const at = (daysAgo: number, time: string) => {
  const date = format(subDays(new Date(), daysAgo), "yyyy-MM-dd");
  return { date, time, createdAt: `${date}T${time}:00`, updatedAt: `${date}T${time}:00`, demo: true };
};

export const createDemoLogs = (): HealthLog[] => [
  {
    id: "demo-water-1",
    kind: "water",
    ...at(0, "08:10"),
    amountMl: 400,
    drinkType: "Water",
    hydrationFactor: 1,
    notes: "Morning glass",
  },
  {
    id: "demo-poop-1",
    kind: "poop",
    ...at(0, "07:42"),
    bristolType: 4,
    amount: "medium",
    color: "Medium brown",
    ease: 4,
    urgency: 2,
    duration: 6,
    feeling: "Relieved",
    severity: 0,
    symptoms: [],
    triggers: ["Fiber"],
    notes: "",
  },
  {
    id: "demo-pee-1",
    kind: "pee",
    ...at(0, "09:25"),
    color: 2,
    amount: "normal",
    urgency: 2,
    stream: 4,
    complete: true,
    severity: 0,
    symptoms: [],
    drinks: ["Water"],
    medication: "",
    notes: "",
  },
  ...Array.from({ length: 9 }).flatMap((_, index): HealthLog[] => {
    const day = index + 1;
    const bristol = [4, 3, 4, 5, 4, 2, 4, 4, 5][index];
    const water = [2050, 2400, 1650, 2300, 1950, 1400, 2250, 2150, 1800][index];
    const dateInfo = at(day, "08:00");
    return [
      {
        id: `demo-water-${day + 1}`,
        kind: "water",
        ...dateInfo,
        amountMl: water,
        drinkType: index % 3 === 0 ? "Tea" : "Water",
        hydrationFactor: index % 3 === 0 ? 0.9 : 1,
        notes: "",
      },
      {
        id: `demo-poop-${day + 1}`,
        kind: "poop",
        ...at(day, index % 3 === 0 ? "09:15" : "07:35"),
        bristolType: bristol,
        amount: index % 4 === 0 ? "small" : "medium",
        color: "Medium brown",
        ease: bristol === 2 ? 2 : 4,
        urgency: bristol === 5 ? 3 : 2,
        duration: bristol === 2 ? 12 : 6,
        feeling: bristol === 2 ? "A little incomplete" : "Relieved",
        severity: bristol === 2 ? 1 : 0,
        symptoms: index === 5 ? ["Constipation", "Bloating"] : index === 2 ? ["Bloating"] : [],
        triggers: index === 2 ? ["Dairy"] : index === 5 ? ["Lack of sleep"] : ["Fiber"],
        notes: "",
      },
      {
        id: `demo-pee-${day + 1}`,
        kind: "pee",
        ...at(day, "10:20"),
        color: water < 1800 ? 4 : 2,
        amount: "normal",
        urgency: 2,
        stream: 4,
        complete: true,
        severity: 0,
        symptoms: [],
        drinks: water < 1800 ? ["Coffee"] : ["Water"],
        medication: "",
        notes: "",
      },
      {
        id: `demo-checkin-${day + 1}`,
        kind: "checkin",
        ...at(day, "20:30"),
        overall: index === 5 ? 3 : 4,
        energy: index % 4 === 0 ? 3 : 4,
        stress: index === 2 ? 4 : 2,
        sleep: index === 5 ? 2 : 4,
        bloating: index === 2 ? 4 : 1,
        discomfort: index === 5 ? 2 : 1,
        notes: index === 2 ? "Busy day and late lunch." : "",
      },
    ];
  }),
];
