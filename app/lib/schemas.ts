import { z } from "zod";

const base = {
  date: z.string().min(1, "Choose a date"),
  time: z.string().min(1, "Choose a time"),
  notes: z.string().max(1000, "Keep notes under 1,000 characters").optional(),
};

export const poopSchema = z.object({
  ...base,
  bristolType: z.number().min(1).max(7),
  amount: z.enum(["small", "medium", "large"]),
  color: z.string().min(1, "Choose a color"),
  ease: z.number().min(1).max(5),
  urgency: z.number().min(1).max(5),
  duration: z.number().min(1).max(180),
  feeling: z.string().min(1, "Choose how you felt afterward"),
  severity: z.number().min(0).max(4),
  symptoms: z.array(z.string()),
  triggers: z.array(z.string()),
});

export const peeSchema = z.object({
  ...base,
  color: z.number().min(1).max(6),
  amount: z.enum(["small", "normal", "large"]),
  urgency: z.number().min(1).max(5),
  stream: z.number().min(1).max(5),
  complete: z.boolean(),
  severity: z.number().min(0).max(4),
  symptoms: z.array(z.string()),
  drinks: z.array(z.string()),
  medication: z.string().max(500).optional(),
});

export const waterSchema = z.object({
  ...base,
  amountMl: z.number().min(30, "Add at least 30 ml").max(5000),
  drinkType: z.string().min(1),
});

export const checkInSchema = z.object({
  ...base,
  overall: z.number().min(1).max(5),
  energy: z.number().min(1).max(5),
  stress: z.number().min(1).max(5),
  sleep: z.number().min(1).max(5),
  bloating: z.number().min(1).max(5),
  discomfort: z.number().min(1).max(5),
});

export type PoopFormValues = z.infer<typeof poopSchema>;
export type PeeFormValues = z.infer<typeof peeSchema>;
export type WaterFormValues = z.infer<typeof waterSchema>;
export type CheckInFormValues = z.infer<typeof checkInSchema>;
