"use client";
import { useEffect, useMemo, useSyncExternalStore } from "react";
import type { Conversation, Person } from "@/types";
import { people } from "@/data/friends";
import { initialConversations } from "@/data/messages";
import { clearRemoteChat, ensureMessagesLoaded, openRemoteChat, remoteChats, removeRemoteMessage, sendRemoteMessage } from "@/lib/messagesSync";
import { createStore } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/lib/useStore";
import { useAuth } from "@/components/auth/AuthProvider";

const store = createStore<Conversation[]>("sitename-messages", initialConversations);
const online = Boolean(supabase);
export type Chat = Conversation & { person: Person };
export type MessageInput = { text: string; image?: string; audio?: Blob };
const lastAt = (item: Conversation) => item.messages[item.messages.length - 1]?.at ?? Number.MAX_SAFE_INTEGER;
const byRecent = (list: Chat[]) => [...list].sort((a, b) => lastAt(b) - lastAt(a));

// With a database, conversations are real and arrive live; otherwise the sample chats are used.
export function useMessages() {
  const [conversations, update] = useStore(store);
  const remote = useSyncExternalStore(remoteChats.subscribe, remoteChats.get, remoteChats.getServer);
  const accountId = useAuth().user?.id;
  useEffect(() => ensureMessagesLoaded(accountId), [accountId]);
  return useMemo(() => {
    if (online) {
      return {
        chats: byRecent(remote),
        open: (userId: string) => void openRemoteChat(userId),
        send: (userId: string, input: MessageInput) => void sendRemoteMessage(userId, input),
        removeMessage: (_userId: string, id: string) => void removeRemoteMessage(id),
        clear: (userId: string) => clearRemoteChat(userId),
      };
    }
    const chats = conversations.map((item) => ({ ...item, person: people.find((entry) => entry.user.id === item.userId) })).filter((item): item is Chat => Boolean(item.person));
    return {
      chats: byRecent(chats),
      open: (userId: string) => update((list) => (list.some((item) => item.userId === userId)
        ? list.map((item) => (item.userId === userId ? { ...item, unread: 0 } : item))
        : people.some((entry) => entry.user.id === userId) ? [...list, { userId, unread: 0, messages: [] }] : list)),
      send: (userId: string, input: MessageInput) => update((list) => list.map((item) => (item.userId === userId
        ? { ...item, messages: [...item.messages, { text: input.text, image: input.image, audio: input.audio ? URL.createObjectURL(input.audio) : undefined, id: `m-${Date.now()}`, from: "me" as const, at: Date.now() }] }
        : item))),
      clear: async (userId: string) => { update((list) => list.map((item) => (item.userId === userId ? { ...item, messages: [], unread: 0 } : item))); return true; },
      removeMessage: (userId: string, id: string) => update((list) => list.map((item) => (item.userId === userId ? { ...item, messages: item.messages.filter((message) => message.id !== id) } : item))),
    };
  }, [conversations, remote, update]);
}
