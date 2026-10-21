"use client";
import { useState, type SyntheticEvent } from "react";
import type { Person } from "@/types";
import { useFriends } from "@/components/friends/useFriends";
import { Avatar } from "./Avatar";

// Typing "@" in a post or comment suggests friends; picking one writes their @name into the text.
export function useMentions(value: string, setValue: (next: string) => void) {
  const { friends } = useFriends();
  const [caret, setCaret] = useState(-1);
  const at = caret < 0 ? value.length : caret;
  const match = /(^|\s)@([A-Za-z0-9_.]{0,30})$/.exec(value.slice(0, at));
  const query = match ? match[2].toLowerCase() : null;
  const list: Person[] = query === null ? [] : friends.filter((item) => item.user.handle && (item.user.handle.toLowerCase().includes(query) || item.user.name.toLowerCase().includes(query))).slice(0, 6);
  const track = (event: SyntheticEvent<HTMLTextAreaElement | HTMLInputElement>) => setCaret(event.currentTarget.selectionStart ?? -1);
  const pick = (handle: string) => {
    if (!match) return;
    const start = at - match[2].length;
    setValue(`${value.slice(0, start)}${handle} ${value.slice(at)}`);
    setCaret(start + handle.length + 1);
  };
  return { list, track, pick };
}

export function MentionList({ list, onPick, up = false }: { list: Person[]; onPick: (handle: string) => void; up?: boolean }) {
  if (!list.length) return null;
  return (
    <ul role="listbox" className={`absolute left-0 z-30 w-64 max-w-[calc(100vw-48px)] overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-xl ${up ? "bottom-full mb-1" : "top-full mt-1"}`}>
      {list.map((item) => (
        <li key={item.user.id}>
          <button type="button" role="option" aria-selected="false" onMouseDown={(event) => { event.preventDefault(); onPick(item.user.handle); }} className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-surface-2">
            <Avatar user={item.user} size="sm" />
            <span className="min-w-0"><span className="block truncate text-sm font-medium text-text">{item.user.name}</span><span className="block truncate text-[11px] text-muted">@{item.user.handle}</span></span>
          </button>
        </li>
      ))}
    </ul>
  );
}
