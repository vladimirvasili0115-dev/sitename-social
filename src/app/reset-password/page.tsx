"use client";
import { useTranslation } from "@/i18n/useTranslation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  return <AuthLayout title={t("auth.resetTitle")} subtitle={t("auth.resetSubtitle")}><ResetPasswordForm /></AuthLayout>;
}
