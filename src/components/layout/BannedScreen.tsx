"use client";
import Link from "next/link";
import { Ban } from "lucide-react";
import type { BanInfo } from "@/lib/banSync";
import { formatClock, formatDay } from "@/lib/datetime";
import { useTranslation } from "@/i18n/useTranslation";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Logo } from "@/components/ui/Logo";

export function BannedScreen({ ban }: { ban: BanInfo }) {
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const until = ban.until ? Date.parse(ban.until) : null;
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-bg px-4 py-10 text-text">
      <Logo />
      <Card className="mt-6 w-full max-w-[440px] p-6 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-surface-2 text-danger"><Ban size={26} /></span>
        <h1 className="mt-4 text-xl font-semibold tracking-[-0.02em]">{t("banned.title")}</h1>
        <p className="mt-2 text-sm leading-6 text-muted">{until ? `${t("banned.until")} ${formatDay(until)}, ${formatClock(until)}` : t("banned.forever")}</p>
        {ban.reason ? <p className="mt-4 rounded-xl bg-surface-2 px-4 py-3 text-left text-sm leading-6"><span className="block text-[11px] font-semibold uppercase tracking-wide text-muted">{t("banned.reason")}</span>{ban.reason}</p> : null}
        <p className="mt-4 text-xs leading-5 text-muted">{t("banned.help")} <Link href="/contact" className="font-semibold text-accent hover:underline">{t("footer.contact")}</Link></p>
        <Button variant="outline" className="mt-5 w-full" onClick={() => void signOut()}>{t("auth.logout")}</Button>
      </Card>
    </div>
  );
}
