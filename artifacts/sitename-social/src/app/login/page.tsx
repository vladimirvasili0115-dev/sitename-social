"use client";
import Link from "next/link";
import { useTranslation } from "@/i18n/useTranslation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  const { t } = useTranslation();
  return <AuthLayout title={t("auth.loginTitle")} subtitle={t("auth.loginSubtitle")} footer={<>{t("auth.noAccount")} <Link href="/register" className="font-semibold text-accent hover:underline">{t("auth.registerButton")}</Link></>}>
    <LoginForm />
  </AuthLayout>;
}
