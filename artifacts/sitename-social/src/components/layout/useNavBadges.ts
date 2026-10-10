"use client";
import { useFriends } from "@/components/friends/useFriends";
import { useMessages } from "@/components/messages/useMessages";

export function useNavBadges(): Record<string, number> {
  const { chats } = useMessages();
  const { incoming } = useFriends();
  return { "/messages": chats.reduce((sum, chat) => sum + chat.unread, 0), "/friends": incoming.length };
}
