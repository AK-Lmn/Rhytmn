"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { AlertTriangle, ArrowLeft, Clock3, Droplets, Save, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { BristolSelector, FieldError, OptionChips, ScaleSelector, UrineColorSelector } from "../components/form-controls";
import { ConfirmDialog, SafetyModal } from "../components/ui";
import { useFormDraft } from "../hooks/use-form-draft";
import { DRINK_TYPES, PEE_SYMPTOMS, POOP_SYMPTOMS, TRIGGERS } from "../lib/constants";
import { deleteRemoteLog, saveRemoteLog } from "../lib/firestore-service";
import {
  checkInSchema,
  type CheckInFormValues,
  peeSchema,
  type PeeFormValues,
  poopSchema,
  type PoopFormValues,
  waterSchema,
  type WaterFormValues,
} from "../lib/schemas";
import { evaluateSafety } from "../lib/safety";
import { useAppStore } from "../store/app-store";
import type { CheckIn, HealthLog, NoteLog, PeeLog, PoopLog, SafetyWarning, WaterLog } from "../types";

const nowDefaults = () => ({ date: format(new Date(), "yyyy-MM-dd"), time: format(new Date(), "HH:mm"), notes: "" });

function FormHeader({ title, intro, edit }: { title: string; intro: string; edit: boolean }) {
  return (
    <header className="form-page-header">
      <a href="/add" aria-label="Back to add menu"><ArrowLeft /></a>
      <div><p className="eyebrow">{edit ? "Edit entry" : "New entry"}</p><h1>{title}</h1><span>{intro}</span></div>
      <span className="draft-status"><Save size={15} /> Draft saved</span>
    </header>
  );
}

function DateTimeFields({ register, errors }: { register: ReturnType<typeof useForm>["register"]; errors: Record<string, { message?: string }> }) {
  return (
    <div className="form-row two">
      <label>Date<input type="date" {...register("date")} /><FieldError message={errors.date?.message} /></label>
      <label>Time<input type="time" {...register("time")} /><FieldError message={errors.time?.message} /></label>
    </div>
  );
}

function FormActions({ edit, deleting, onDelete }: { edit: boolean; deleting: boolean; onDelete: () => void }) {
  return (
    <div className="sticky-form-actions">
      {edit && <button type="button" className="button danger-text" onClick={onDelete} disabled={deleting}><Trash2 /> Delete</button>}
      <a className="button ghost" href="/history">Cancel</a>
      <button className="button primary" type="submit"><Save /> {edit ? "Save changes" : "Save entry"}</button>
    </div>
  );
}

function useEditing(kind: HealthLog["kind"]) {
  const logs = useAppStore((state) => state.logs);
  const id = typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("id") ?? "";
  return useMemo(() => logs.find((log) => log.id === id && log.kind === kind), [id, kind, logs]);
}

async function persistLog(log: HealthLog) {
  const state = useAppStore.getState();
  state.upsertLog(log);
  if (state.profile && state.mode === "firebase") await saveRemoteLog(state.profile.uid, log);
  state.showToast(log.updatedAt !== log.createdAt ? "Changes saved" : "Entry saved");
  window.location.href = "/home";
}

function useDeleteFlow(editing?: HealthLog) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const execute = async () => {
    if (!editing) return;
    setDeleting(true);
    const state = useAppStore.getState();
    state.deleteLog(editing.id);
    if (state.profile && state.mode === "firebase") await deleteRemoteLog(state.profile.uid, editing);
    state.showToast("Entry deleted");
    window.location.href = "/history";
  };
  return { confirmDelete, setConfirmDelete, deleting, execute };
}

export function PoopFormScreen() {
  const editing = useEditing("poop") as PoopLog | undefined;
  const logs = useAppStore((state) => state.logs);
  const mode = useAppStore((state) => state.mode);
  const [warning, setWarning] = useState<SafetyWarning | null>(null);
  const [pending, setPending] = useState<PoopFormValues | null>(null);
  const deletion = useDeleteFlow(editing);
  const form = useForm<PoopFormValues>({
    resolver: zodResolver(poopSchema),
    defaultValues: editing ?? {
      ...nowDefaults(), bristolType: 4, amount: "medium", color: "Medium brown", ease: 3, urgency: 2, duration: 5,
      feeling: "Relieved", severity: 0, symptoms: [], triggers: [],
    },
  });
  const observedSymptoms = useWatch({ control: form.control, name: "symptoms" });
  const observedColor = useWatch({ control: form.control, name: "color" });
  const clearDraft = useFormDraft("rhythm-draft-poop", form, !editing);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (form.formState.isDirty) event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [form.formState.isDirty]);

  const save = async (values: PoopFormValues, acknowledged = false) => {
    const safety = evaluateSafety({ kind: "poop", ...values }, logs);
    if (safety && !acknowledged) { setPending(values); setWarning(safety); return; }
    const now = new Date().toISOString();
    clearDraft();
    await persistLog({ id: editing?.id ?? crypto.randomUUID(), kind: "poop", ...values, severity: values.severity as 0 | 1 | 2 | 3 | 4, createdAt: editing?.createdAt ?? now, updatedAt: now, demo: mode === "demo" });
  };

  return (
    <div className="page form-page">
      <FormHeader title="Bowel movement" intro="Capture the details that matter to you." edit={Boolean(editing)} />
      <form onSubmit={form.handleSubmit((values) => void save(values))}>
        <section className="form-section"><div className="section-title"><span>1</span><div><h2>When was it?</h2><p>Date and time are filled with now.</p></div></div><DateTimeFields register={form.register as never} errors={form.formState.errors as never} /></section>
        <section className="form-section">
          <div className="section-title"><span>2</span><div><h2>What best matches?</h2><p>The Bristol scale is a descriptive shape guide, not a diagnosis.</p></div></div>
          <Controller name="bristolType" control={form.control} render={({ field }) => <BristolSelector value={field.value} onChange={field.onChange} />} />
          <FieldError message={form.formState.errors.bristolType?.message} />
        </section>
        <section className="form-section">
          <div className="section-title"><span>3</span><div><h2>Basic details</h2><p>Add only what feels useful.</p></div></div>
          <div className="form-block"><label>Amount</label><Controller name="amount" control={form.control} render={({ field }) => <OptionChips options={["small", "medium", "large"]} value={field.value} onChange={field.onChange} />} /></div>
          <div className="form-row two"><label>Color<select {...form.register("color")}><option>Light brown</option><option>Medium brown</option><option>Dark brown</option><option>Green</option><option>Yellow</option><option>Red</option><option>Black or tar-like</option><option>Other</option></select></label><label>Duration (minutes)<input type="number" min="1" max="180" {...form.register("duration", { valueAsNumber: true })} /></label></div>
          <div className="form-row two"><div className="form-block"><label>Ease of passing</label><Controller name="ease" control={form.control} render={({ field }) => <ScaleSelector value={field.value} onChange={field.onChange} labels={["Difficult", "Easy"]} />} /></div><div className="form-block"><label>Urgency</label><Controller name="urgency" control={form.control} render={({ field }) => <ScaleSelector value={field.value} onChange={field.onChange} labels={["Low", "High"]} />} /></div></div>
          <label>Feeling afterward<select {...form.register("feeling")}><option>Relieved</option><option>Neutral</option><option>A little incomplete</option><option>Still uncomfortable</option></select></label>
        </section>
        <section className="form-section">
          <div className="section-title"><span>4</span><div><h2>Symptoms & possible triggers</h2><p>Select any that apply. Tags describe overlap, not cause.</p></div></div>
          <div className="form-block"><label>Symptoms</label><Controller name="symptoms" control={form.control} render={({ field }) => <OptionChips multiple options={POOP_SYMPTOMS} value={field.value} onChange={field.onChange} />} /></div>
          <div className="form-block"><label>Overall symptom severity</label><Controller name="severity" control={form.control} render={({ field }) => <ScaleSelector min={0} max={4} value={field.value} onChange={field.onChange} labels={["None", "Severe"]} />} /></div>
          <div className="form-block"><label>Possible triggers</label><Controller name="triggers" control={form.control} render={({ field }) => <OptionChips multiple options={TRIGGERS} value={field.value} onChange={field.onChange} />} /></div>
          <label>Optional notes<textarea rows={4} placeholder="Anything else you want to remember…" {...form.register("notes")} /><FieldError message={form.formState.errors.notes?.message} /></label>
          {(observedSymptoms.includes("Blood") || observedColor === "Black or tar-like") && <div className="inline-warning"><AlertTriangle /> These selections will show a calm safety check before saving.</div>}
        </section>
        <FormActions edit={Boolean(editing)} deleting={deletion.deleting} onDelete={() => deletion.setConfirmDelete(true)} />
      </form>
      <SafetyModal warning={warning} onCancel={() => setWarning(null)} onAcknowledge={() => pending && void save(pending, true)} />
      <ConfirmDialog open={deletion.confirmDelete} title="Delete this entry?" text="This can’t be undone." confirmLabel="Delete entry" danger onCancel={() => deletion.setConfirmDelete(false)} onConfirm={() => void deletion.execute()} />
    </div>
  );
}

export function PeeFormScreen() {
  const editing = useEditing("pee") as PeeLog | undefined;
  const logs = useAppStore((state) => state.logs);
  const mode = useAppStore((state) => state.mode);
  const [warning, setWarning] = useState<SafetyWarning | null>(null);
  const [pending, setPending] = useState<PeeFormValues | null>(null);
  const deletion = useDeleteFlow(editing);
  const form = useForm<PeeFormValues>({
    resolver: zodResolver(peeSchema),
    defaultValues: editing ?? { ...nowDefaults(), color: 2, amount: "normal", urgency: 2, stream: 4, complete: true, severity: 0, symptoms: [], drinks: [], medication: "" },
  });
  const clearDraft = useFormDraft("rhythm-draft-pee", form, !editing);

  const save = async (values: PeeFormValues, acknowledged = false) => {
    const safety = evaluateSafety({ kind: "pee", ...values }, logs);
    if (safety && !acknowledged) { setPending(values); setWarning(safety); return; }
    const now = new Date().toISOString();
    clearDraft();
    await persistLog({ id: editing?.id ?? crypto.randomUUID(), kind: "pee", ...values, severity: values.severity as 0 | 1 | 2 | 3 | 4, createdAt: editing?.createdAt ?? now, updatedAt: now, demo: mode === "demo" });
  };

  return (
    <div className="page form-page">
      <FormHeader title="Urination" intro="A quick hydration and comfort check." edit={Boolean(editing)} />
      <form onSubmit={form.handleSubmit((values) => void save(values))}>
        <section className="form-section"><div className="section-title"><span>1</span><div><h2>When was it?</h2><p>Date and time are filled with now.</p></div></div><DateTimeFields register={form.register as never} errors={form.formState.errors as never} /></section>
        <section className="form-section"><div className="section-title"><span>2</span><div><h2>Hydration color</h2><p>Choose the closest tasteful color swatch.</p></div></div><Controller name="color" control={form.control} render={({ field }) => <UrineColorSelector value={field.value} onChange={field.onChange} />} /></section>
        <section className="form-section">
          <div className="section-title"><span>3</span><div><h2>Flow & comfort</h2><p>Simple descriptive scales.</p></div></div>
          <div className="form-block"><label>Amount</label><Controller name="amount" control={form.control} render={({ field }) => <OptionChips options={["small", "normal", "large"]} value={field.value} onChange={field.onChange} />} /></div>
          <div className="form-row two"><div className="form-block"><label>Urgency</label><Controller name="urgency" control={form.control} render={({ field }) => <ScaleSelector value={field.value} onChange={field.onChange} labels={["Low", "High"]} />} /></div><div className="form-block"><label>Stream strength</label><Controller name="stream" control={form.control} render={({ field }) => <ScaleSelector value={field.value} onChange={field.onChange} labels={["Weak", "Strong"]} />} /></div></div>
          <Controller name="complete" control={form.control} render={({ field }) => <label className="check-row"><input type="checkbox" checked={field.value} onChange={field.onChange} /><span><strong>Felt completely emptied</strong><small>Turn off if it felt incomplete.</small></span></label>} />
        </section>
        <section className="form-section">
          <div className="section-title"><span>4</span><div><h2>Symptoms & context</h2><p>Choose any that apply.</p></div></div>
          <div className="form-block"><label>Symptoms</label><Controller name="symptoms" control={form.control} render={({ field }) => <OptionChips multiple options={PEE_SYMPTOMS} value={field.value} onChange={field.onChange} />} /></div>
          <div className="form-block"><label>Overall symptom severity</label><Controller name="severity" control={form.control} render={({ field }) => <ScaleSelector min={0} max={4} value={field.value} onChange={field.onChange} labels={["None", "Severe"]} />} /></div>
          <div className="form-block"><label>Drinks beforehand</label><Controller name="drinks" control={form.control} render={({ field }) => <OptionChips multiple options={DRINK_TYPES.map((item) => item.name)} value={field.value} onChange={field.onChange} />} /></div>
          <div className="form-row two"><label>Medication note<input placeholder="Optional" {...form.register("medication")} /></label><label>Optional notes<textarea rows={3} {...form.register("notes")} /></label></div>
        </section>
        <FormActions edit={Boolean(editing)} deleting={deletion.deleting} onDelete={() => deletion.setConfirmDelete(true)} />
      </form>
      <SafetyModal warning={warning} onCancel={() => setWarning(null)} onAcknowledge={() => pending && void save(pending, true)} />
      <ConfirmDialog open={deletion.confirmDelete} title="Delete this entry?" text="This can’t be undone." confirmLabel="Delete entry" danger onCancel={() => deletion.setConfirmDelete(false)} onConfirm={() => void deletion.execute()} />
    </div>
  );
}

export function WaterFormScreen() {
  const editing = useEditing("water") as WaterLog | undefined;
  const logs = useAppStore((state) => state.logs);
  const mode = useAppStore((state) => state.mode);
  const deletion = useDeleteFlow(editing);
  const form = useForm<WaterFormValues>({ resolver: zodResolver(waterSchema), defaultValues: editing ?? { ...nowDefaults(), amountMl: 250, drinkType: "Water" } });
  const clearDraft = useFormDraft("rhythm-draft-water", form, !editing);
  const observedDrink = useWatch({ control: form.control, name: "drinkType" });
  const observedAmount = useWatch({ control: form.control, name: "amountMl" });
  const selectedDrink = DRINK_TYPES.find((item) => item.name === observedDrink) ?? DRINK_TYPES[0];
  const history = logs.filter((log) => log.kind === "water").slice(0, 5) as WaterLog[];

  const save = async (values: WaterFormValues) => {
    const now = new Date().toISOString();
    clearDraft();
    await persistLog({ id: editing?.id ?? crypto.randomUUID(), kind: "water", ...values, hydrationFactor: DRINK_TYPES.find((item) => item.name === values.drinkType)?.factor ?? 0.75, createdAt: editing?.createdAt ?? now, updatedAt: now, demo: mode === "demo" });
  };

  const undo = async () => {
    const latest = history[0];
    if (!latest) return;
    const state = useAppStore.getState();
    state.deleteLog(latest.id);
    if (state.profile && state.mode === "firebase") await deleteRemoteLog(state.profile.uid, latest);
    state.showToast("Last drink entry undone");
  };

  return (
    <div className="page form-page">
      <FormHeader title="Water & drinks" intro="Keep hydration simple and transparent." edit={Boolean(editing)} />
      <form onSubmit={form.handleSubmit((values) => void save(values))}>
        <section className="form-section">
          <div className="section-title"><span>1</span><div><h2>How much?</h2><p>Choose a usual amount or enter your own.</p></div></div>
          <div className="amount-picker">{[150, 250, 350, 500, 750].map((amount) => <button type="button" key={amount} className={observedAmount === amount ? "selected" : ""} onClick={() => form.setValue("amountMl", amount, { shouldDirty: true })}><Droplets />{amount}<small>ml</small></button>)}</div>
          <label>Custom amount (ml)<input type="number" min="30" max="5000" step="10" {...form.register("amountMl", { valueAsNumber: true })} /><FieldError message={form.formState.errors.amountMl?.message} /></label>
        </section>
        <section className="form-section">
          <div className="section-title"><span>2</span><div><h2>Drink details</h2><p>Different drinks receive a simple hydration factor.</p></div></div>
          <Controller name="drinkType" control={form.control} render={({ field }) => <OptionChips options={DRINK_TYPES.map((item) => item.name)} value={field.value} onChange={field.onChange} />} />
          <div className="factor-note"><Droplets /><span><strong>{Math.round(selectedDrink.factor * 100)}% hydration credit</strong>{observedAmount} ml counts as {Math.round(observedAmount * selectedDrink.factor)} ml toward your chart. This simple factor is not medical guidance.</span></div>
          <DateTimeFields register={form.register as never} errors={form.formState.errors as never} />
          <label>Optional notes<textarea rows={3} placeholder="Morning tea, after a walk…" {...form.register("notes")} /></label>
        </section>
        <FormActions edit={Boolean(editing)} deleting={deletion.deleting} onDelete={() => deletion.setConfirmDelete(true)} />
      </form>
      {!editing && history.length > 0 && <section className="form-section compact-history"><div className="section-title"><span><Clock3 /></span><div><h2>Recent drinks</h2><p>Your five latest hydration entries.</p></div></div>{history.map((log) => <div className="mini-history" key={log.id}><span>{log.drinkType}</span><strong>{log.amountMl} ml</strong><time>{log.date} · {log.time}</time></div>)}<button className="button ghost" onClick={() => void undo()}>Undo last entry</button></section>}
      <ConfirmDialog open={deletion.confirmDelete} title="Delete this entry?" text="This can’t be undone." confirmLabel="Delete entry" danger onCancel={() => deletion.setConfirmDelete(false)} onConfirm={() => void deletion.execute()} />
    </div>
  );
}

export function CheckInFormScreen() {
  const editing = useEditing("checkin") as CheckIn | undefined;
  const mode = useAppStore((state) => state.mode);
  const deletion = useDeleteFlow(editing);
  const overallQuery = typeof window === "undefined" ? 4 : Number(new URLSearchParams(window.location.search).get("overall") ?? 4);
  const form = useForm<CheckInFormValues>({ resolver: zodResolver(checkInSchema), defaultValues: editing ?? { ...nowDefaults(), overall: overallQuery, energy: 3, stress: 2, sleep: 3, bloating: 1, discomfort: 1 } });
  const clearDraft = useFormDraft("rhythm-draft-checkin", form, !editing);
  const scales: Array<{ name: keyof CheckInFormValues; label: string; low: string; high: string }> = [
    { name: "overall", label: "Overall feeling", low: "Rough", high: "Great" },
    { name: "energy", label: "Energy level", low: "Drained", high: "Energized" },
    { name: "stress", label: "Stress level", low: "Calm", high: "High" },
    { name: "sleep", label: "Sleep quality", low: "Poor", high: "Restful" },
    { name: "bloating", label: "Bloating", low: "None", high: "Strong" },
    { name: "discomfort", label: "Abdominal discomfort", low: "None", high: "Strong" },
  ];

  const save = async (values: CheckInFormValues) => {
    const now = new Date().toISOString();
    clearDraft();
    await persistLog({ id: editing?.id ?? crypto.randomUUID(), kind: "checkin", ...values, createdAt: editing?.createdAt ?? now, updatedAt: now, demo: mode === "demo" });
  };
  return (
    <div className="page form-page checkin-form">
      <FormHeader title="Daily check-in" intro="A quick moment to notice how today feels." edit={Boolean(editing)} />
      <form onSubmit={form.handleSubmit((values) => void save(values))}>
        <section className="form-section"><DateTimeFields register={form.register as never} errors={form.formState.errors as never} /></section>
        <section className="form-section"><div className="section-title"><span>1</span><div><h2>Today at a glance</h2><p>Use the scales in whatever way feels consistent to you.</p></div></div>{scales.map((scale) => <div className="checkin-scale" key={scale.name}><label>{scale.label}</label><Controller name={scale.name} control={form.control} render={({ field }) => <ScaleSelector value={Number(field.value)} onChange={field.onChange} labels={[scale.low, scale.high]} />} /></div>)}</section>
        <section className="form-section"><label>Optional note<textarea rows={5} placeholder="Anything that shaped today?" {...form.register("notes")} /></label></section>
        <FormActions edit={Boolean(editing)} deleting={deletion.deleting} onDelete={() => deletion.setConfirmDelete(true)} />
      </form>
      <ConfirmDialog open={deletion.confirmDelete} title="Delete this check-in?" text="This can’t be undone." confirmLabel="Delete entry" danger onCancel={() => deletion.setConfirmDelete(false)} onConfirm={() => void deletion.execute()} />
    </div>
  );
}

export function NoteFormScreen() {
  const logs = useAppStore((state) => state.logs);
  const mode = useAppStore((state) => state.mode);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [triggers, setTriggers] = useState<string[]>([]);
  const [severity, setSeverity] = useState(0);
  const [warning, setWarning] = useState<SafetyWarning | null>(null);

  const submit = async (acknowledged = false) => {
    if (!title.trim() && !notes.trim()) return;
    const candidate = { kind: "note" as const, symptoms, severity };
    const safety = evaluateSafety(candidate, logs);
    if (safety && !acknowledged) { setWarning(safety); return; }
    const now = new Date();
    const log: NoteLog = { id: crypto.randomUUID(), kind: "note", title: title || "Wellness note", date: format(now, "yyyy-MM-dd"), time: format(now, "HH:mm"), createdAt: now.toISOString(), updatedAt: now.toISOString(), notes, symptoms, triggers, severity: severity as 0 | 1 | 2 | 3 | 4, demo: mode === "demo" };
    await persistLog(log);
  };

  return (
    <div className="page form-page">
      <FormHeader title="Symptom or note" intro="Capture context without forcing it into a category." edit={false} />
      <form onSubmit={(event) => { event.preventDefault(); void submit(); }}>
        <section className="form-section"><label>Short title<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Felt bloated after lunch" /></label><label>Note<textarea rows={5} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="What would you like to remember?" /></label></section>
        <section className="form-section"><div className="form-block"><label>Symptoms</label><OptionChips multiple options={[...POOP_SYMPTOMS, ...PEE_SYMPTOMS.filter((item) => !POOP_SYMPTOMS.includes(item as never))]} value={symptoms} onChange={(value) => setSymptoms(value as string[])} /></div><div className="form-block"><label>Severity</label><ScaleSelector min={0} max={4} value={severity} onChange={setSeverity} labels={["None", "Severe"]} /></div><div className="form-block"><label>Possible triggers</label><OptionChips multiple options={TRIGGERS} value={triggers} onChange={(value) => setTriggers(value as string[])} /></div></section>
        <FormActions edit={false} deleting={false} onDelete={() => undefined} />
      </form>
      <SafetyModal warning={warning} onCancel={() => setWarning(null)} onAcknowledge={() => void submit(true)} />
    </div>
  );
}
