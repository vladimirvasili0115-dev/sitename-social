"use client";
import { useState } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { Card } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import { AdminContent } from "@/components/admin/AdminContent";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { AdminReports } from "@/components/admin/AdminReports";
import { AdminUsers } from "@/components/admin/AdminUsers";
import { AdminSettings } from "@/components/admin/AdminSettings";
import { AdminLog } from "@/components/admin/AdminLog";
import { useIsAdmin } from "@/components/report/useIsAdmin";

type AdminTab = "overview" | "reports" | "users" | "content" | "settings" | "log";

export default function AdminPage() {
  const { t } = useTranslation();
  const admin = useIsAdmin();
  const [tab, setTab] = useState<AdminTab>("overview");
  if (admin === null) return null;
  if (!admin) return <Card className="p-8 text-center text-sm text-muted">{t("admin.noAccess")}</Card>;
  return (
    <div className="mx-auto max-w-[760px]">
      <h1 className="mb-4 px-1 text-[23px] font-semibold tracking-[-0.035em]">{t("nav.admin")}</h1>
      <Tabs<AdminTab> active={tab} onChange={setTab} tabs={[
        { id: "overview", label: t("admin.tabOverview") }, { id: "reports", label: t("admin.tabReports") },
        { id: "users", label: t("admin.tabUsers") }, { id: "content", label: t("admin.tabContent") },
        { id: "settings", label: t("admin.tabSettings") }, { id: "log", label: t("admin.tabLog") },
      ]} />
      {tab === "overview" ? <AdminDashboard /> : null}
      {tab === "reports" ? <AdminReports /> : null}
      {tab === "users" ? <AdminUsers /> : null}
      {tab === "content" ? <AdminContent /> : null}
      {tab === "settings" ? <AdminSettings /> : null}
      {tab === "log" ? <AdminLog /> : null}
    </div>
  );
}
