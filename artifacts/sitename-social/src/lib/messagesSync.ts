import type { Conversation, Person } from "@/types";
import { isDataUrl, uploadBlob, uploadImage } from "./media";
import { supabase } from "./supabase";
import { flashRefusal } from "./flash";
import { fetchUsers } from "./usersCache";

export type RemoteChat = Conversation & { person: Person };
type Row = { id: string; sender_id: string; recipient_id: string; text: string; image_url: string | null; audio_url?: string | null; read_at: string | null; delivered_at?: string | null; reply_to?: string | null; created_at: string };

const none: RemoteChat[] = [];
let state = none;
let loadedFor: string | null = null;
const opened = new Set<string>();
const listeners = new Set<() => void>();
function set(next: RemoteChat[]) {
  state = next;
  listeners.forEach((listener) => listener());
}
export const remoteChats = {
  get: () => state,
  getServer: () => none,
  subscribe: (listener: () => void) => {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  },
};
async function sessionUserId() {
  if (!supabase) return null;
  return (await supabase.auth.getSession()).data.session?.user.id ?? null;
}

export async function refreshMessages() {
  const userId = await sessionUserId();
  if (!supabase || !userId) return set(none);
  const { data, error } = await supabase.from("messages").select("*")
    .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`).order("created_at", { ascending: false }).limit(1000);
  if (error) return console.error("Messages could not be loaded:", error.message);
  // "Clear chat": messages up to the moment a player cleared the chat are hidden for that player only (the other side keeps them).
  const clears = new Map<string, number>();
  const cleared = await supabase.from("message_clears").select("other_id,cleared_at").eq("user_id", userId);
  if (!cleared.error) for (const item of (cleared.data ?? []) as { other_id: string; cleared_at: string }[]) clears.set(item.other_id, Date.parse(item.cleared_at));
  // "Delete for me": messages this player hid for themselves only (needs paket-FE.sql; without it nothing is hidden).
  const hidden = new Set<string>();
  const hides = await supabase.from("message_hides").select("message_id").eq("user_id", userId);
  if (!hides.error) for (const item of (hides.data ?? []) as { message_id: string }[]) hidden.add(String(item.message_id));
  const byUser = new Map<string, Conversation>();
  opened.forEach((id) => byUser.set(id, { userId: id, unread: 0, messages: [] }));
  [...(data as Row[])].reverse().forEach((row) => {
    const mine = row.sender_id === userId;
    const other = mine ? row.recipient_id : row.sender_id;
    if (Date.parse(row.created_at) <= (clears.get(other) ?? 0)) return;
    if (hidden.has(String(row.id))) return;
    const chat = byUser.get(other) ?? { userId: other, unread: 0, messages: [] };
    chat.messages.push({ id: row.id, from: mine ? "me" : "them", text: row.text, image: row.image_url ?? undefined, audio: row.audio_url ?? undefined, at: Date.parse(row.created_at), read: mine ? Boolean(row.read_at) : undefined, delivered: mine ? Boolean(row.delivered_at || row.read_at) : undefined, replyTo: row.reply_to ? String(row.reply_to) : undefined });
    if (!mine && !row.read_at) chat.unread += 1;
    byUser.set(other, chat);
  });
  // Messages that reached me get the "delivered" mark (the sender sees two grey ticks, blue once read).
  if ((data as Row[]).some((row) => row.recipient_id === userId && !row.delivered_at && !row.read_at && "delivered_at" in row)) {
    void supabase.from("messages").update({ delivered_at: new Date().toISOString() }).eq("recipient_id", userId).is("delivered_at", null).then(() => undefined);
  }
  const users = await fetchUsers([...byUser.keys()]);
  set([...byUser.values()].flatMap((chat) => {
    const person = users.get(chat.userId);
    return person ? [{ ...chat, person }] : [];
  }));
}
export function ensureMessagesLoaded(userId: string | undefined) {
  if (!supabase || !userId || loadedFor === userId) return;
  loadedFor = userId;
  void refreshMessages();
}
export function resetRemoteMessages() {
  loadedFor = null;
  opened.clear();
  set(none);
}

export async function openRemoteChat(otherId: string) {
  const userId = await sessionUserId();
  if (!supabase || !userId || otherId === userId) return;
  opened.add(otherId);
  await supabase.from("messages").update({ read_at: new Date().toISOString() }).eq("sender_id", otherId).eq("recipient_id", userId).is("read_at", null);
  await refreshMessages();
}
export async function sendRemoteMessage(otherId: string, input: { text: string; image?: string; audio?: Blob; replyTo?: string }) {
  if (!supabase) return;
  const image_url = isDataUrl(input.image) ? await uploadImage(input.image, "messages") : input.image && /^(https:\/\/|\/custom\/)/.test(input.image) ? input.image : null;
  const audio_url = input.audio ? await uploadBlob(input.audio, "voice", input.audio.type.includes("mp4") ? "m4a" : "webm") : null;
  if (input.audio && !audio_url) return;
  const { error } = await supabase.from("messages").insert({ recipient_id: otherId, text: input.text, image_url, ...(audio_url ? { audio_url } : {}), ...(input.replyTo ? { reply_to: input.replyTo } : {}) });
  if (error && !flashRefusal(error.message)) console.error("Message could not be sent:", error.message);
  await refreshMessages();
}
export async function removeRemoteMessage(id: string) {
  if (!supabase) return;
  await supabase.from("messages").delete().eq("id", id);
  await refreshMessages();
}

// "Delete for me": the messages disappear for this player only (mine or theirs). Needs paket-FE.sql.
export async function hideRemoteMessages(ids: string[]) {
  if (!supabase || !ids.length) return;
  const { error } = await supabase.rpc("message_hide", { p_ids: ids });
  if (error) console.error("Messages could not be hidden:", error.message);
  await refreshMessages();
}
// "Delete for everyone": only my own messages go, for both sides. Needs paket-FE.sql.
export async function deleteRemoteMessages(ids: string[]) {
  if (!supabase || !ids.length) return;
  const { error } = await supabase.rpc("message_delete_all", { p_ids: ids });
  if (error) console.error("Messages could not be deleted:", error.message);
  await refreshMessages();
}

// Clears the whole chat with one person for me only (the server writes the moment; needs paket-DZ.sql).
export async function clearRemoteChat(otherId: string) {
  if (!supabase) return false;
  const { error } = await supabase.rpc("message_clear", { p_other: otherId });
  if (error) { console.error("Chat could not be cleared:", error.message); return false; }
  opened.delete(otherId);
  await refreshMessages();
  return true;
}

// The chat a click on the envelope should open: the newest one with unread messages (null when nothing is unread).
export function newestUnreadChat() {
  let best: { id: string; at: number } | null = null;
  for (const chat of state) {
    if (!chat.unread) continue;
    const at = chat.messages[chat.messages.length - 1]?.at ?? 0;
    if (!best || at > best.at) best = { id: chat.userId, at };
  }
  return best?.id ?? null;
}
// Opens that chat even when the Messages page is already open.
export function openChatFromBadge() {
  const id = newestUnreadChat();
  if (id) window.dispatchEvent(new CustomEvent("open-chat", { detail: id }));
  return id;
}
