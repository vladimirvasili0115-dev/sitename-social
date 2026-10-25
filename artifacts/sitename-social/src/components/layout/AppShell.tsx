"use client";
import { useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isAuthRoute, isPublicRoute } from "@/lib/auth";
import { useAuth } from "@/components/auth/AuthProvider";
import { useSettings } from "@/components/settings/useSettings";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { Footer } from "./Footer";
import { FlashNotice } from "./FlashNotice";
import { SiteNotice } from "./SiteNotice";
import { BannedScreen } from "./BannedScreen";
import { banStore } from "@/lib/banSync";
import { ReportHost } from "@/components/report/ReportHost";
import { SiteMusicHost } from "@/components/music/siteMusic";
import { CallHost } from "@/components/calls/CallHost";
import { ReelsHost } from "@/components/reels/ReelsHost";
import { startCallService, updateCallSelf } from "@/lib/callSync";
import { useProfile } from "@/components/profile/useProfile";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, ready } = useAuth();
  const authRoute = isAuthRoute(pathname);
  const hadUser = useRef(false);
  const publicRoute = isPublicRoute(pathname);
  // The game page is a light page: no side panels, no calls, no site music, no reels (less work in the background while playing).
  const lite = pathname.startsWith("/bottle");
  const { settings } = useSettings();
  const ban = useSyncExternalStore(banStore.subscribe, banStore.get, banStore.getServer);
  // Calls: listen for incoming calls on every page while signed in.
  const profile = useProfile().user;
  const accountId = user?.id;
  useEffect(() => { if (!accountId || lite) return; return startCallService({ id: accountId, name: profile.name, avatar: profile.avatar }); }, [accountId, lite]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (accountId) updateCallSelf({ id: accountId, name: profile.name, avatar: profile.avatar }); }, [accountId, profile.name, profile.avatar]);

  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme;
  }, [settings.theme]);
  // An invite link (?ref=<user id>) is remembered until the new player opens the bottle game.
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref && /^[0-9a-f-]{36}$/i.test(ref)) { try { window.localStorage.setItem("sitename-ref", ref); } catch { /* storage is blocked */ } }
  }, []);

  useEffect(() => {
    if (!ready || publicRoute) return;
    // "why=session" marks a login that was lost while the site was open (helps tell apart sign-in problems on one device).
    if (!user && !authRoute) router.replace(hadUser.current ? "/login?why=session" : "/login");
    if (user) hadUser.current = true;
    if (user && authRoute) router.replace("/feed");
  }, [ready, user, authRoute, publicRoute, router]);

  if (authRoute || publicRoute) return <>{children}</>;
  if (!ready || !user) return <div className="min-h-[100dvh] bg-bg" />;
  if (ban) return <BannedScreen ban={ban} />;

  if (lite) return <div className="min-h-[100dvh] bg-bg text-text"><main className="min-w-0">{children}</main></div>;

  return <div className="min-h-[100dvh] bg-bg text-text">
    <Header />
    <SiteNotice />
    <div className="mx-auto flex min-h-[calc(100dvh-72px)] max-w-[1160px] items-start gap-6 px-4 pt-6 md:px-6">
      <Sidebar />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
    <Footer />
    <MobileNav />
    <FlashNotice />
    <ReportHost />
    <SiteMusicHost />
    <CallHost />
    <ReelsHost />
  </div>;
}
