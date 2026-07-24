"use client";

import { AlertTriangle, Check, Droplets, FileQuestion, Plus, Toilet, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { useAppStore } from "../store/app-store";
import type { HealthLog, SafetyWarning } from "../types";

function useDialogFocus(open: boolean, onClose: () => void) {
  const dialogRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusable = () => Array.from(
      dialog?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ) ?? [],
    );
    focusable()[0]?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusable();
      if (!items.length) return;
      const first = items[0];
      const last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = oldOverflow;
      document.removeEventListener("keydown", onKeyDown);
      previous?.focus();
    };
  }, [onClose, open]);
  return dialogRef;
}

export function IconBadge({ kind }: { kind: HealthLog["kind"] }) {
  const icon =
    kind === "poop" ? (
      <Toilet />
    ) : kind === "pee" ? (
      <Droplets />
    ) : kind === "water" ? (
      <Droplets />
    ) : kind === "checkin" ? (
      <Check />
    ) : (
      <FileQuestion />
    );
  return <span className={`entry-icon ${kind}`}>{icon}</span>;
}

export function EmptyState({
  title,
  text,
  action,
  href = "/add",
}: {
  title: string;
  text: string;
  action?: string;
  href?: string;
}) {
  return (
    <div className="empty-state">
      <span className="empty-orbit" aria-hidden="true"><i /><i /><i /></span>
      <h3>{title}</h3>
      <p>{text}</p>
      {action && (
        <a className="button primary" href={href}>
          <Plus size={18} /> {action}
        </a>
      )}
    </div>
  );
}

export function ProgressRing({ value, goal, label }: { value: number; goal: number; label?: string }) {
  const ratio = Math.min(1, value / goal);
  return (
    <div
      className="progress-ring"
      style={{ "--progress": `${ratio * 360}deg` } as React.CSSProperties}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={goal}
      aria-valuenow={value}
      aria-label={`Hydration ${value} of ${goal} milliliters`}
    >
      <div>
        <strong>{Math.round(ratio * 100)}%</strong>
        <span>{label ?? "of goal"}</span>
      </div>
    </div>
  );
}

export function Toast() {
  const toast = useAppStore((state) => state.toast);
  const clearToast = useAppStore((state) => state.clearToast);
  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(clearToast, 3200);
    return () => window.clearTimeout(timeout);
  }, [toast, clearToast]);
  if (!toast) return null;
  return (
    <div className="toast" role="status">
      <Check size={18} />
      {toast}
      <button onClick={clearToast} aria-label="Dismiss notification"><X size={16} /></button>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  text,
  confirmLabel,
  danger = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  text: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const dialogRef = useDialogFocus(open, onCancel);
  if (!open) return null;
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onCancel}>
      <section ref={dialogRef} className="modal" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-description" onMouseDown={(event) => event.stopPropagation()}>
        <span className={danger ? "modal-icon danger" : "modal-icon"}><AlertTriangle /></span>
        <h2 id="confirm-title">{title}</h2>
        <p id="confirm-description">{text}</p>
        <div className="modal-actions">
          <button className="button ghost" type="button" onClick={onCancel}>Cancel</button>
          <button className={`button ${danger ? "danger" : "primary"}`} type="button" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </section>
    </div>
  );
}

export function SafetyModal({
  warning,
  onAcknowledge,
  onCancel,
}: {
  warning: SafetyWarning | null;
  onAcknowledge: () => void;
  onCancel: () => void;
}) {
  const dialogRef = useDialogFocus(Boolean(warning), onCancel);
  if (!warning) return null;
  return (
    <div className="modal-backdrop" role="presentation">
      <section ref={dialogRef} className="modal safety-modal" role="alertdialog" aria-modal="true" aria-labelledby="safety-title" aria-describedby="safety-description">
        <span className="modal-icon warning"><AlertTriangle /></span>
        <p className="eyebrow">Safety check</p>
        <h2 id="safety-title">{warning.title}</h2>
        <p id="safety-description">{warning.message}</p>
        <ul>{warning.reasons.map((reason) => <li key={reason}>{reason}</li>)}</ul>
        <div className="emergency-note">
          If you feel severely unwell or symptoms may be life-threatening, seek immediate local emergency care.
        </div>
        <p className="fine-print">Rhythm does not diagnose conditions or replace professional medical advice.</p>
        <div className="modal-actions">
          <button className="button ghost" type="button" onClick={onCancel}>Review entry</button>
          <button className="button primary" type="button" onClick={onAcknowledge}>I understand, save</button>
        </div>
      </section>
    </div>
  );
}

export function MetricCard({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string | number;
  detail: string;
  tone: "amber" | "blue" | "green" | "violet";
}) {
  return (
    <article className={`metric-card ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

export function PageHeader({ eyebrow, title, intro, actions }: { eyebrow?: string; title: string; intro?: string; actions?: React.ReactNode }) {
  return (
    <header className="page-header">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {intro && <p>{intro}</p>}
      </div>
      {actions && <div className="header-actions">{actions}</div>}
    </header>
  );
}
