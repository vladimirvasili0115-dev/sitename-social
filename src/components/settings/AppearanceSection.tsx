"use client";
import { Moon, PlayCircle, Sun, VolumeX } from "lucide-react";
import { useTranslation } from "@/i18n/useTranslation";
import { Switch } from "@/components/ui/Switch";
import { cn } from "@/lib/utils";
import { SettingRow } from "./SettingRow";
import { SettingsSection } from "./SettingsSection";
import { useSettings } from "./useSettings";

export function AppearanceSection() {
  const { t } = useTranslation();
  const { settings, set } = useSettings();
  const themes = [{ id: "dark" as const, icon: Moon, label: t("settings.themeDark") }, { id: "light" as const, icon: Sun, label: t("settings.themeLight") }];
  return (
    <>
      <SettingsSection title={t("settings.appTheme")}>
        <div className="grid grid-cols-2 gap-3 p-4">
          {themes.map(({ id, icon: Icon, label }) => (
            <button key={id} onClick={() => set({ theme: id })} aria-pressed={settings.theme === id} className={cn("flex items-center justify-center gap-2 rounded-xl border py-4 text-sm font-semibold", settings.theme === id ? "border-accent bg-surface-2 text-accent" : "border-border text-muted hover:text-text")}>
              <Icon size={18} />{label}
            </button>
          ))}
        </div>
      </SettingsSection>
      <SettingsSection title={t("nav.videos")}>
        <SettingRow icon={PlayCircle} title={t("settings.appAutoplay")} hint={t("settings.appAutoplayHint")}><Switch checked={settings.autoplay} onChange={(autoplay) => set({ autoplay })} label={t("settings.appAutoplay")} /></SettingRow>
        <SettingRow icon={VolumeX} title={t("settings.appMuted")}><Switch checked={settings.reelsMuted} onChange={(reelsMuted) => set({ reelsMuted })} label={t("settings.appMuted")} /></SettingRow>
      </SettingsSection>
    </>
  );
}
