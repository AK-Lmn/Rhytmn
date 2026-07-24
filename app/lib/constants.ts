export const BRISTOL_TYPES = [
  { value: 1, label: "Separate, firm pieces", tone: "Very firm" },
  { value: 2, label: "Lumpy and formed", tone: "Firm" },
  { value: 3, label: "Formed with cracks", tone: "Typical" },
  { value: 4, label: "Smooth and soft", tone: "Typical" },
  { value: 5, label: "Soft pieces", tone: "Soft" },
  { value: 6, label: "Fluffy, loose pieces", tone: "Loose" },
  { value: 7, label: "Watery", tone: "Very loose" },
] as const;

export const POOP_SYMPTOMS = [
  "Constipation",
  "Diarrhea",
  "Cramps",
  "Bloating",
  "Gas",
  "Nausea",
  "Mucus",
  "Blood",
  "Pain",
  "Feeling incomplete",
  "Persistent vomiting",
] as const;

export const PEE_SYMPTOMS = [
  "Burning",
  "Pain",
  "Strong smell",
  "Cloudiness",
  "Blood",
  "Leakage",
  "Difficulty starting",
  "Weak stream",
  "Frequent urge",
  "Incomplete emptying",
  "Unable to urinate",
  "Severe dehydration",
] as const;

export const TRIGGERS = [
  "Dairy",
  "Spicy food",
  "High-fat food",
  "Fiber",
  "Caffeine",
  "Stress",
  "Medication",
  "Illness",
  "Travel",
  "Menstruation",
  "Lack of sleep",
] as const;

export const DRINK_TYPES = [
  { name: "Water", factor: 1 },
  { name: "Tea", factor: 0.9 },
  { name: "Coffee", factor: 0.8 },
  { name: "Juice", factor: 0.85 },
  { name: "Sports drink", factor: 0.9 },
  { name: "Soda", factor: 0.7 },
  { name: "Other", factor: 0.75 },
] as const;

export const DEFAULT_PREFERENCES = {
  preferredName: "Alex",
  waterGoalMl: 2200,
  theme: "system",
  reminders: true,
  reminderTime: "19:00",
  discreetNotifications: true,
  privateMode: false,
  hideDashboardDetails: false,
  pinEnabled: false,
  weekStartsOn: 1,
  dateFormat: "MMM d, yyyy",
  units: "metric",
  trackingGoal: "Understand my daily rhythm",
} as const;
