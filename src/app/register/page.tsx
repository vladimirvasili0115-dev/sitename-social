"use client";
import Link from "next/link";
import { useTranslation } from "@/i18n/useTranslation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  const { t } = useTranslation();
  return <AuthLayout title={t("auth.registerTitle")} subtitle={t("auth.registerSubtitle")} footer={<>{t("auth.haveAccount")} <Link href="/login" className="font-semibold text-accent hover:underline">{t("auth.loginButton")}</Link></>}>
    <RegisterForm />
  </AuthLayout>;
}
