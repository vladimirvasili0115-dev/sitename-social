import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export function SettingRow({ icon: Icon, title, hint, children }: { icon?: LucideIcon; title: string; hint?: string; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2 p-4">
      {Icon ? <Icon size={18} className="shrink-0 text-accent" /> : null}
      <div className="min-w-[140px] flex-1">
        <p className="text-sm font-medium">{title}</p>
        {hint ? <p className="mt-0.5 break-words text-xs leading-5 text-muted">{hint}</p> : null}
      </div>
      {children ? <div className="flex shrink-0 items-center gap-2">{children}</div> : null}
    </div>
  );
}
