"use client";

import { Check } from "lucide-react";
import { BRISTOL_TYPES } from "../lib/constants";

export function OptionChips({
  options,
  value,
  onChange,
  multiple = false,
}: {
  options: readonly string[];
  value: string | string[];
  onChange: (value: string | string[]) => void;
  multiple?: boolean;
}) {
  const selected = (option: string) => multiple ? (value as string[]).includes(option) : value === option;
  const toggle = (option: string) => {
    if (!multiple) return onChange(option);
    const current = value as string[];
    onChange(current.includes(option) ? current.filter((item) => item !== option) : [...current, option]);
  };
  return (
    <div className="option-chips">
      {options.map((option) => (
        <button type="button" key={option} className={selected(option) ? "selected" : ""} onClick={() => toggle(option)}>
          {selected(option) && <Check size={14} />} {option}
        </button>
      ))}
    </div>
  );
}

export function ScaleSelector({
  value,
  onChange,
  min = 1,
  max = 5,
  labels,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  labels?: [string, string];
}) {
  const numbers = Array.from({ length: max - min + 1 }, (_, index) => min + index);
  return (
    <div className="scale-selector">
      <div>{numbers.map((number) => <button type="button" key={number} className={number === value ? "selected" : ""} onClick={() => onChange(number)}>{number}</button>)}</div>
      {labels && <p><span>{labels[0]}</span><span>{labels[1]}</span></p>}
    </div>
  );
}

export function BristolSelector({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <div className="bristol-grid">
      {BRISTOL_TYPES.map((type) => (
        <button type="button" key={type.value} className={value === type.value ? "selected" : ""} onClick={() => onChange(type.value)}>
          <span className={`bristol-shape type-${type.value}`} aria-hidden="true"><i /><i /><i /></span>
          <strong>Type {type.value}</strong><small>{type.label}</small><em>{type.tone}</em>
        </button>
      ))}
    </div>
  );
}

export function UrineColorSelector({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const labels = ["Very pale", "Pale yellow", "Light yellow", "Yellow", "Dark yellow", "Amber"];
  return (
    <div className="urine-scale">
      {labels.map((label, index) => {
        const number = index + 1;
        return <button type="button" key={label} className={value === number ? "selected" : ""} onClick={() => onChange(number)}><i className={`urine-${number}`} /><strong>{number}</strong><span>{label}</span></button>;
      })}
    </div>
  );
}

export function FieldError({ message }: { message?: string }) {
  return message ? <span className="field-error" role="alert">{message}</span> : null;
}
