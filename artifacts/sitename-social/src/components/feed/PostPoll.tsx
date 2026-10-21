"use client";
import { BarChart3, Check } from "lucide-react";
import type { Poll } from "@/types";
import { useTranslation } from "@/i18n/useTranslation";
import { cn } from "@/lib/utils";

// A poll in a post: tap an answer to vote; after voting (and for the author) the results show as bars.
export function PostPoll({ poll, mine, onVote }: { poll: Poll; mine?: boolean; onVote: (choice: number | null) => void }) {
  const { t } = useTranslation();
  const total = poll.votes.reduce((sum, count) => sum + count, 0);
  const results = poll.mine !== undefined || Boolean(mine);
  return (
    <div className="mx-4 mb-2 rounded-xl border border-border p-3">
      <p className="mb-2.5 flex items-start gap-2 text-sm font-semibold text-text"><BarChart3 size={17} className="mt-0.5 shrink-0 text-[#F59E0B]" />{poll.question}</p>
      <ul className="space-y-1.5">
        {poll.options.map((option, index) => {
          const count = poll.votes[index] ?? 0;
          const share = total ? Math.round((count / total) * 100) : 0;
          const chosen = poll.mine === index;
          return (
            <li key={index}>
              <button type="button" onClick={() => onVote(chosen ? null : index)} aria-pressed={chosen} className={cn("relative flex h-10 w-full items-center overflow-hidden rounded-lg border text-left text-[13px] transition-colors", chosen ? "border-accent" : "border-border hover:border-accent/60", !results && "hover:bg-surface-2")}>
                {results ? <span aria-hidden="true" className={cn("absolute inset-y-0 left-0 transition-[width] duration-500", chosen ? "bg-accent/25" : "bg-surface-2")} style={{ width: `${share}%` }} /> : null}
                <span className="relative flex min-w-0 flex-1 items-center gap-1.5 px-3">{chosen ? <Check size={14} className="shrink-0 text-accent" /> : null}<span className="truncate">{option}</span></span>
                {results ? <span className="relative shrink-0 px-3 text-xs font-semibold tabular-nums text-muted">{share}%</span> : null}
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-[11px] text-muted">{t("poll.votes").replace("{n}", String(total))}{poll.mine !== undefined ? ` · ${t("poll.tapToUndo")}` : ""}</p>
    </div>
  );
}
