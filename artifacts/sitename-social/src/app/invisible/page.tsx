"use client";
import { CheckCheck, Eye, EyeOff, Footprints, Radio, type LucideIcon } from "lucide-react";
import type { InvisibleState } from "@/types";
import { useTranslation } from "@/i18n/useTranslation";
import type { TranslationKey } from "@/i18n/LanguageProvider";
import { Card } from "@/components/ui/Card";
import { Switch } from "@/components/ui/Switch";
import { useInvisible } from "@/components/invisible/useInvisible";
import { cn } from "@/lib/utils";

type OptionKey = Exclude<keyof InvisibleState, "enabled">;
const options: { key: OptionKey; icon: LucideIcon; title: TranslationKey; hint: TranslationKey }[] = [
  { key: "hideOnline", icon: Radio, title: "invisible.optOnline", hint: "invisible.optOnlineHint" },
  { key: "hideVisits", icon: Footprints, title: "invisible.optVisits", hint: "invisible.optVisitsHint" },
  { key: "hideRead", icon: CheckCheck, title: "invisible.optRead", hint: "invisible.optReadHint" },
];

export default function InvisiblePage() {
  const { t } = useTranslation();
  const { state, set } = useInvisible();
  const Icon = state.enabled ? EyeOff : Eye;
  return (
    <div className="mx-auto max-w-[620px]">
      <h1 className="mb-4 px-1 text-[23px] font-semibold tracking-[-0.035em]">{t("nav.invisible")}</h1>
      <Card className="relative mb-4 overflow-hidden p-5 sm:p-6">
        {state.enabled ? <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle_at_90%_10%,color-mix(in_srgb,var(--accent)_22%,transparent),transparent_55%)]" /> : null}
        <div className="relative flex items-center gap-4">
          <span className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-border", state.enabled ? "bg-accent text-bg" : "bg-surface-2 text-muted")}><Icon size={26} /></span>
          <div className="min-w-0 flex-1">
            <p className="text-base font-semibold">{t(state.enabled ? "invisible.on" : "invisible.off")}</p>
            <p className="mt-1 text-sm leading-6 text-muted">{t("invisible.description")}</p>
          </div>
          <Switch size="lg" checked={state.enabled} onChange={(enabled) => set({ enabled })} label={t("nav.invisible")} />
        </div>
      </Card>
      <Card>
        <ul className="divide-y divide-border">
          {options.map(({ key, icon: OptionIcon, title, hint }) => (
            <li key={key} className={cn("flex items-center gap-3.5 p-4", !state.enabled && "opacity-50")}>
              <OptionIcon size={18} className="shrink-0 text-accent" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{t(title)}</p>
                <p className="mt-0.5 text-xs leading-5 text-muted">{t(hint)}</p>
              </div>
              <Switch checked={state[key]} disabled={!state.enabled} onChange={(value) => set({ [key]: value })} label={t(title)} />
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
