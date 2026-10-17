"use client";

export function Select<T extends string>({ value, onChange, options, label }: { value: T; onChange: (value: T) => void; options: { value: T; label: string }[]; label: string }) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value as T)} aria-label={label} className="h-10 max-w-[180px] rounded-xl border border-border bg-surface-2 px-3 text-sm text-text outline-none focus:border-accent">
      {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>
  );
}
