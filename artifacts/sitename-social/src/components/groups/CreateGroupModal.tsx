"use client";
import { useEffect, useState, type FormEvent } from "react";
import { Users, X } from "lucide-react";
import type { Group, GroupCategory } from "@/types";
import { groupCategories } from "@/data/groups";
import { useTranslation } from "@/i18n/useTranslation";
import { AuthField } from "@/components/auth/AuthField";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import { categoryLabels } from "./GroupCard";

const inputClass = "mt-1.5 w-full rounded-xl border border-border bg-surface-2 px-3.5 text-sm text-text outline-none focus:border-accent";

export function CreateGroupModal({ onCreate, onClose }: { onCreate: (input: Pick<Group, "name" | "category" | "description">) => void; onClose: () => void }) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<GroupCategory>("music");
  const [description, setDescription] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (name.trim().length < 2) return setError(true);
    onCreate({ name: name.trim(), category, description: description.trim() });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[color-mix(in_srgb,var(--bg)_80%,transparent)] sm:items-center sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <Card role="dialog" aria-modal="true" aria-labelledby="create-group-title" className="w-full max-w-[460px] rounded-b-none sm:rounded-b-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 id="create-group-title" className="text-base font-semibold">{t("groups.create")}</h2>
          <IconButton aria-label={t("common.cancel")} onClick={onClose}><X size={18} /></IconButton>
        </div>
        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-4 p-5">
            <AuthField label={t("groups.name")} icon={Users} value={name} maxLength={50} onChange={(event) => setName(event.target.value)} error={error ? t("auth.errRequired") : undefined} />
            <label className="block text-xs font-medium text-muted">{t("groups.category")}
              <select value={category} onChange={(event) => setCategory(event.target.value as GroupCategory)} className={`${inputClass} h-12`}>
                {groupCategories.map((item) => <option key={item} value={item}>{t(categoryLabels[item])}</option>)}
              </select>
            </label>
            <label className="block text-xs font-medium text-muted">{t("groups.description")}
              <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} maxLength={200} className={`${inputClass} resize-none py-3 leading-6`} />
            </label>
          </div>
          <div className="flex justify-end gap-2 border-t border-border px-5 py-3">
            <Button type="button" variant="subtle" onClick={onClose}>{t("common.cancel")}</Button>
            <Button type="submit">{t("groups.create")}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
