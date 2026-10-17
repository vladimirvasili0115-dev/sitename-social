"use client";
import { useEffect, useSyncExternalStore } from "react";
import { BadgeCheck } from "lucide-react";
import { currentUser } from "@/data/users";
import { ensureVerifiedLoaded, verifiedStore, type VerifiedKind } from "@/lib/verifiedSync";
import { useTranslation } from "@/i18n/useTranslation";
import { useAuth } from "@/components/auth/AuthProvider";

// The signed-in user is shown under a local id in some places; it is mapped back to the real account.
export function useVerified(userId: string | undefined): VerifiedKind | null {
  const list = useSyncExternalStore(verifiedStore.subscribe, verifiedStore.get, verifiedStore.getServer);
  const accountId = useAuth().user?.id;
  useEffect(() => ensureVerifiedLoaded(), []);
  const id = userId === currentUser.id ? accountId : userId;
  return (id && list[id]) || null;
}

// Blue tick for verified accounts, gold tick for the site's official account.
export function VerifiedMark({ userId, size = 15 }: { userId: string | undefined; size?: number }) {
  const { t } = useTranslation();
  const kind = useVerified(userId);
  if (!kind) return null;
  const label = t(kind === "official" ? "verified.official" : "verified.badge");
  return <BadgeCheck role="img" aria-label={label} size={size} strokeWidth={2.2} className="ml-1 inline-block shrink-0 align-[-2px]" style={{ color: kind === "official" ? "#E7B93C" : "#3B9DF8" }}><title>{label}</title></BadgeCheck>;
}
