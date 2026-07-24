export type LogKind = "poop" | "pee" | "water" | "checkin" | "note";

export type Severity = 0 | 1 | 2 | 3 | 4;

export interface BaseLog {
  id: string;
  kind: LogKind;
  date: string;
  time: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  demo?: boolean;
}

export interface PoopLog extends BaseLog {
  kind: "poop";
  bristolType: number;
  amount: "small" | "medium" | "large";
  color: string;
  ease: number;
  urgency: number;
  duration: number;
  feeling: string;
  severity: Severity;
  symptoms: string[];
  triggers: string[];
}

export interface PeeLog extends BaseLog {
  kind: "pee";
  color: number;
  amount: "small" | "normal" | "large";
  urgency: number;
  stream: number;
  complete: boolean;
  severity: Severity;
  symptoms: string[];
  drinks: string[];
  medication?: string;
}

export interface WaterLog extends BaseLog {
  kind: "water";
  amountMl: number;
  drinkType: string;
  hydrationFactor: number;
}

export interface CheckIn extends BaseLog {
  kind: "checkin";
  overall: number;
  energy: number;
  stress: number;
  sleep: number;
  bloating: number;
  discomfort: number;
}

export interface NoteLog extends BaseLog {
  kind: "note";
  title: string;
  symptoms: string[];
  triggers: string[];
  severity: Severity;
}

export type HealthLog = PoopLog | PeeLog | WaterLog | CheckIn | NoteLog;

export interface Preferences {
  preferredName: string;
  waterGoalMl: number;
  theme: "light" | "dark" | "system";
  reminders: boolean;
  reminderTime: string;
  discreetNotifications: boolean;
  privateMode: boolean;
  hideDashboardDetails: boolean;
  pinEnabled: boolean;
  weekStartsOn: 0 | 1;
  dateFormat: "MMM d, yyyy" | "dd/MM/yyyy" | "MM/dd/yyyy";
  units: "metric" | "imperial";
  trackingGoal: string;
}

export interface UserProfile {
  uid: string;
  email?: string;
  preferredName: string;
  createdAt: string;
  demo: boolean;
}

export interface GeneratedInsight {
  id: string;
  title: string;
  observation: string;
  detail: string;
  tone: "neutral" | "positive" | "attention";
}

export interface SafetyWarning {
  id: string;
  level: "attention" | "urgent";
  title: string;
  message: string;
  reasons: string[];
}
