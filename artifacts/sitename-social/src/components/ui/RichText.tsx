"use client";
import Link from "next/link";
import { Fragment } from "react";

// Post and comment text with clickable @names (open that profile) and #hashtags (posts with that tag).
const PATTERN = /(@[A-Za-z0-9_.]{2,40}|#[\p{L}\p{N}_]{2,50})/gu;

export function RichText({ text, className }: { text: string; className?: string }) {
  const parts = text.split(PATTERN);
  return (
    <p className={className}>
      {parts.map((part, index) => {
        if (index % 2 === 0) return <Fragment key={index}>{part}</Fragment>;
        const word = part.slice(1).replace(/\.+$/, "");
        const tail = part.slice(1 + word.length);
        const href = part.startsWith("@") ? `/user?h=${encodeURIComponent(word)}` : `/tag?t=${encodeURIComponent(word)}`;
        return <Fragment key={index}><Link href={href} onClick={(event) => event.stopPropagation()} className="font-medium text-accent hover:underline">{part[0]}{word}</Link>{tail}</Fragment>;
      })}
    </p>
  );
}

// Hashtags of a text (without "#"), for showing them under a post or searching.
export const hashtags = (text: string) => [...new Set([...text.matchAll(/#([\p{L}\p{N}_]{2,50})/gu)].map((match) => match[1].toLowerCase()))];
