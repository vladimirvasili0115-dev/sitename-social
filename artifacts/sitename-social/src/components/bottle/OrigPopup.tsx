"use client";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// The original game's dialog shell (bottle-html5 Dialog + popup CSS): white card with 17px corners and a soft shadow,
// a grey title row, a white round close button sticking out of the top-right corner, content, and a row of buttons.
export function OrigPopup({ title, onClose, children, buttons, className, z = "z-[60]" }: { title?: ReactNode; onClose: () => void; children: ReactNode; buttons?: ReactNode; className?: string; z?: string }) {
  return (
    <div className={cn("absolute inset-0 flex items-center justify-center bg-black/30 p-4", z)} onClick={onClose}>
      <div role="dialog" aria-label={typeof title === "string" ? title : undefined} onClick={(event) => event.stopPropagation()} className={cn("relative flex max-h-[80%] w-full max-w-[360px] flex-col rounded-[17px] bg-white text-[#424242] shadow-[0_4px_8px_rgba(0,0,0,0.2)] animate-[bottle-pop_0.3s_ease-out]", className)}>
        <button onClick={onClose} aria-label="×" className="absolute -right-2.5 -top-2.5 z-[1] flex h-8 w-8 items-center justify-center rounded-2xl bg-white shadow-[0_4px_8px_rgba(0,0,0,0.2)] active:brightness-75">
          <span aria-hidden="true" className="h-4 w-4 bg-contain bg-no-repeat" style={{ backgroundImage: "url(/custom/orig/popup_btn_close.svg)" }} />
        </button>
        {title ? <div className="flex h-11 shrink-0 items-center overflow-hidden px-[15px]"><p className="flex-1 truncate text-center text-[14px] font-bold text-[#CFCFCF]">{title}</p></div> : <div className="h-[15px] shrink-0" />}
        <div className="min-h-0 overflow-auto px-[15px]">{children}</div>
        {buttons ? <div className="flex shrink-0 items-center justify-center gap-5 p-[15px]">{buttons}</div> : <div className="h-[15px] shrink-0" />}
      </div>
    </div>
  );
}

// Buttons of the original dialogs: green "confirm", white with a green rim "cancel", blue "info", red "danger".
export function OrigButton({ kind = "confirm", onClick, children, disabled }: { kind?: "confirm" | "cancel" | "info" | "danger"; onClick?: () => void; children: ReactNode; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={cn("flex h-[30px] min-w-[80px] items-center justify-center whitespace-nowrap px-3 text-[14px] transition-colors active:bg-[#F4F2EF] active:text-[#424242] disabled:pointer-events-none disabled:border-0 disabled:bg-[#C7C7C7] disabled:text-white",
      kind === "cancel" ? "rounded-md border border-[#97CA31] bg-white text-[#97CA31]" : kind === "info" ? "rounded-[7px] bg-[#2F89E9] text-white" : kind === "danger" ? "rounded-[7px] bg-[#E03D1F] text-white" : "rounded-[7px] bg-[#97CA31] text-white")}>
      {children}
    </button>
  );
}
