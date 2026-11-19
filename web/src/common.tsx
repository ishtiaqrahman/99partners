/** Shared presentation and optional browser persistence; monetary decisions stay in the engine. */
import React from "react";
import { ArrowDown, ArrowUpDown, ChevronDown } from "lucide-react";

export const number = (n: number) => n.toLocaleString("en-US");
export const readLocal = <T,>(key: string, fallback: T): T => {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") ?? fallback;
  } catch {
    return fallback;
  }
};
export const saveLocal = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Browser storage is optional for the analytical workflow. */
  }
};
export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: string;
}) {
  return <span className={"badge " + tone}>{children}</span>;
}
export function ErrorBox({ error }: { error: string }) {
  return (
    <div className="error" role="alert">
      {error}
    </div>
  );
}
export function Metric({
  label,
  value,
  note,
  icon,
  accent = false,
}: {
  label: string;
  value: string;
  note: string;
  icon: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className={"metric " + (accent ? "metric-accent" : "")}>
      <div>
        {label}
        <span>{icon}</span>
      </div>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}
export function Select({
  label,
  value,
  onChange,
  options,
  allowAll = true,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  allowAll?: boolean;
  options: (string | { value: string; label: string })[];
}) {
  return (
    <label className="select-wrap">
      <span className="select-label">{label}</span>
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {allowAll && <option value="">All</option>}
        {options.map((o) => {
          const v = typeof o === "string" ? o : o.value;
          return (
            <option key={v} value={v}>
              {typeof o === "string" ? o : o.label}
            </option>
          );
        })}
      </select>
      <ChevronDown size={13} />
    </label>
  );
}
export function SortIcon({ active, desc }: { active: boolean; desc: boolean }) {
  return active ? (
    <ArrowDown
      size={13}
      style={{ transform: desc ? "none" : "rotate(180deg)" }}
    />
  ) : (
    <ArrowUpDown size={12} />
  );
}

/** Keep definitions beside the decision they explain. Native disclosure works with click, touch and keyboard. */
export function Explanation({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <details className="explanation">
      <summary>{label}</summary>
      <div>{children}</div>
    </details>
  );
}

export const productLabels: Record<string, string> = {
  "Core workflow": "Core operations software",
  "Vertical add-on": "Industry-specific add-on",
  "Horizontal software": "General-purpose software",
  "Services / hardware": "Services or hardware",
  Unresolved: "Unclear product type",
};
