"use client";
import { Moon, PlayCircle, Sun, VolumeX } from "lucide-react";
import { useTranslation } from "@/i18n/useTranslation";
import { Switch } from "@/components/ui/Switch";
import { cn } from "@/lib/utils";
import { SettingRow } from "./SettingRow";
import { SettingsSection } from "./SettingsSection";
import { HOME_STYLES, HomeStylePreview } from "@/components/feed/HomeStyles";
import type { TranslationKey } from "@/i18n/LanguageProvider";
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
      <SettingsSection title={t("settings.homeStyle")}>
        <p className="px-4 pt-3 text-xs text-muted">{t("settings.homeStyleHint")}</p>
        <div className="grid grid-cols-2 gap-3 p-4">
          {HOME_STYLES.map((id) => (
            <button key={id} onClick={() => set({ homeStyle: id })} aria-pressed={(settings.homeStyle ?? "neon") === id} className={cn("rounded-xl border p-2.5 text-left", (settings.homeStyle ?? "neon") === id ? "border-accent bg-surface-2" : "border-border hover:bg-surface-2")}>
              <HomeStylePreview style={id} />
              <span className={cn("block text-sm font-semibold", (settings.homeStyle ?? "neon") === id ? "text-accent" : "text-text")}>{t(`home.${id}` as TranslationKey)}</span>
              <span className="block text-[11px] leading-4 text-muted">{t(`home.${id}Text` as TranslationKey)}</span>
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
