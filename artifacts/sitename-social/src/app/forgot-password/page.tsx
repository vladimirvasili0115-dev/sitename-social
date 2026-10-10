"use client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "@/i18n/useTranslation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  return <AuthLayout title={t("auth.forgotTitle")} subtitle={t("auth.forgotSubtitle")} footer={<Link href="/login" className="inline-flex items-center gap-1.5 font-semibold text-accent hover:underline"><ArrowLeft size={15} />{t("auth.backToLogin")}</Link>}>
    <ForgotPasswordForm />
  </AuthLayout>;
}
