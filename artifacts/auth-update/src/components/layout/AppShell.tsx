"use client";
import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isAuthRoute } from "@/lib/auth";
import { useAuth } from "@/components/auth/AuthProvider";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, ready } = useAuth();
  const authRoute = isAuthRoute(pathname);

  useEffect(() => {
    if (!ready) return;
    if (!user && !authRoute) router.replace("/login");
    if (user && authRoute) router.replace("/feed");
  }, [ready, user, authRoute, router]);

  if (authRoute) return <>{children}</>;
  if (!ready || !user) return <div className="min-h-[100dvh] bg-bg" />;

  return <div className="min-h-[100dvh] bg-bg text-text">
    <Header />
    <div className="mx-auto flex max-w-[1160px] items-start gap-6 px-4 pb-24 pt-6 md:px-6 lg:pb-10">
      <Sidebar />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
    <MobileNav />
  </div>;
}
