"use client";
import { useId, useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff, type LucideIcon } from "lucide-react";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";

type AuthFieldProps = InputHTMLAttributes<HTMLInputElement> & { label: string; icon: LucideIcon; error?: string };

export function AuthField({ label, icon: Icon, error, type = "text", className, ...props }: AuthFieldProps) {
  const { t } = useTranslation();
  const id = useId();
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-muted">{label}</label>
      <div className={cn(
        "flex h-12 items-center gap-2.5 rounded-xl border bg-surface-2 px-3.5 transition-colors focus-within:border-accent",
        error ? "border-[var(--danger)]" : "border-border",
      )}>
        <Icon size={17} className="shrink-0 text-muted" />
        <input
          id={id}
          type={isPassword && visible ? "text" : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className="h-full w-full min-w-0 bg-transparent text-sm text-text outline-none placeholder:text-muted"
          {...props}
        />
        {isPassword ? (
          <button type="button" onClick={() => setVisible((value) => !value)} aria-label={t(visible ? "auth.hidePassword" : "auth.showPassword")} className="-mr-1.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted hover:text-text">
            {visible ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        ) : null}
      </div>
      {error ? <p id={`${id}-error`} className="mt-1.5 text-xs text-[var(--danger)]">{error}</p> : null}
    </div>
  );
}
