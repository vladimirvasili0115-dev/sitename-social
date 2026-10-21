"use client";
import type { ReactNode } from "react";
import { ExpressionPicker } from "./ExpressionPicker";

// The emoji button used across the site: the full emoji set by category (stickers and GIFs where onMedia is given).
export function EmojiPicker({ label, trigger, triggerClassName, onPick, onMedia, up = false }: { label: string; trigger: ReactNode; triggerClassName?: string; onPick: (emoji: string) => void; onMedia?: (url: string) => void; up?: boolean }) {
  return <ExpressionPicker label={label} trigger={trigger} triggerClassName={triggerClassName} onEmoji={onPick} onMedia={onMedia} up={up} />;
}
