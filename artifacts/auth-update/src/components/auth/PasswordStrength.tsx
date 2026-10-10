"use client";
import { passwordScore } from "@/lib/auth";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";

const labels = ["auth.strengthWeak", "auth.strengthWeak", "auth.strengthMedium", "auth.strengthStrong"] as const;
const colors = ["bg-border", "bg-[var(--danger)]", "bg-accent-2", "bg-accent"];

export function PasswordStrength({ value }: { value: string }) {
  const { t } = useTranslation();
  const score = passwordScore(value);
  if (!score) return null;
  return (
    <div className="mt-2 flex items-center gap-3">
      <div className="grid flex-1 grid-cols-3 gap-1.5">
        {[1, 2, 3].map((step) => <span key={step} className={cn("h-1 rounded-full", step <= score ? colors[score] : "bg-border")} />)}
      </div>
      <span className="text-xs text-muted">{t(labels[score])}</span>
    </div>
  );
}
