import type { TranslationKey } from "@/i18n/LanguageProvider";

// A short notice shown at the bottom of the screen (for example when the server refuses an action).
export const FLASH_EVENT = "sitename-flash";
export function flash(key: TranslationKey) {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent<TranslationKey>(FLASH_EVENT, { detail: key }));
}
// Maps a privacy refusal from the database to a notice. Returns true when one was shown.
export function flashRefusal(message: string | undefined) {
  if (!message) return false;
  const key: TranslationKey | null = message.includes("privacy_messages") ? "privacy.noMessages" : message.includes("privacy_requests") ? "privacy.noRequests" : message.includes("privacy_gifts") ? "privacy.noGifts" : message.includes("banned_word") ? "privacy.bannedWord" : message.includes("rate_limit") ? "privacy.rateLimit" : message.includes("welcome_no_reply") ? "privacy.welcomeNoReply" : null;
  if (key) flash(key);
  return Boolean(key);
}
