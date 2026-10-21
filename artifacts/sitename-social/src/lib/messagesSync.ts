import type { Conversation, Person } from "@/types";
import { isDataUrl, uploadBlob, uploadImage } from "./media";
import { supabase } from "./supabase";
import { flashRefusal } from "./flash";
import { fetchUsers } from "./usersCache";

export type RemoteChat = Conversation & { person: Person };
type Row = { id: string; sender_id: string; recipient_id: string; text: string; image_url: string | null; audio_url?: string | null; read_at: string | null; delivered_at?: string | null; created_at: string };

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
  const byUser = new Map<string, Conversation>();
  opened.forEach((id) => byUser.set(id, { userId: id, unread: 0, messages: [] }));
  [...(data as Row[])].reverse().forEach((row) => {
    const mine = row.sender_id === userId;
    const other = mine ? row.recipient_id : row.sender_id;
    const chat = byUser.get(other) ?? { userId: other, unread: 0, messages: [] };
    chat.messages.push({ id: row.id, from: mine ? "me" : "them", text: row.text, image: row.image_url ?? undefined, audio: row.audio_url ?? undefined, at: Date.parse(row.created_at), read: mine ? Boolean(row.read_at) : undefined, delivered: mine ? Boolean(row.delivered_at || row.read_at) : undefined });
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
export async function sendRemoteMessage(otherId: string, input: { text: string; image?: string; audio?: Blob }) {
  if (!supabase) return;
  const image_url = isDataUrl(input.image) ? await uploadImage(input.image, "messages") : null;
  const audio_url = input.audio ? await uploadBlob(input.audio, "voice", input.audio.type.includes("mp4") ? "m4a" : "webm") : null;
  if (input.audio && !audio_url) return;
  const { error } = await supabase.from("messages").insert({ recipient_id: otherId, text: input.text, image_url, ...(audio_url ? { audio_url } : {}) });
  if (error && !flashRefusal(error.message)) console.error("Message could not be sent:", error.message);
  await refreshMessages();
}
export async function removeRemoteMessage(id: string) {
  if (!supabase) return;
  await supabase.from("messages").delete().eq("id", id);
  await refreshMessages();
}
