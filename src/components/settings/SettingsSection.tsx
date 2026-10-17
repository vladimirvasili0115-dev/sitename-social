import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";

export function SettingsSection({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="mb-4">
      {title ? <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted">{title}</h2> : null}
      <Card className="divide-y divide-border">{children}</Card>
    </section>
  );
}
