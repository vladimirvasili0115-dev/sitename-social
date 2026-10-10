"use client";
import { useEffect, type ReactNode } from "react";
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
import { ReportHost } from "@/components/report/ReportHost";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, ready } = useAuth();
  const authRoute = isAuthRoute(pathname);
  const publicRoute = isPublicRoute(pathname);
  const { settings } = useSettings();

  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme;
  }, [settings.theme]);

  useEffect(() => {
    if (!ready || publicRoute) return;
    if (!user && !authRoute) router.replace("/login");
    if (user && authRoute) router.replace("/feed");
  }, [ready, user, authRoute, publicRoute, router]);

  if (authRoute || publicRoute) return <>{children}</>;
  if (!ready || !user) return <div className="min-h-[100dvh] bg-bg" />;

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
  </div>;
}
