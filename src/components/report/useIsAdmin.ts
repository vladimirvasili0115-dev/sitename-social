"use client";
import { useEffect, useState } from "react";
import { fetchIsAdmin } from "@/lib/reportsSync";
import { useAuth } from "@/components/auth/AuthProvider";

export function useIsAdmin() {
  const accountId = useAuth().user?.id;
  const [admin, setAdmin] = useState<boolean | null>(null);
  useEffect(() => {
    let active = true;
    void fetchIsAdmin(accountId).then((value) => { if (active) setAdmin(value); });
    return () => { active = false; };
  }, [accountId]);
  return admin;
}
