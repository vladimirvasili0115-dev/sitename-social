import { refreshFriends } from "./friendsSync";
import { refreshGifts } from "./giftsSync";
import { refreshMessages } from "./messagesSync";
import { refreshNotices } from "./notificationsSync";
import { refreshPosts } from "./postsSync";
import { supabase } from "./supabase";

// Live updates: new messages and notifications arrive without reloading the page.
export function startRealtime(userId: string) {
  if (!supabase) return () => undefined;
  const client = supabase;
  const channel = client.channel(`user-${userId}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `recipient_id=eq.${userId}` }, () => void refreshMessages())
    // My message was read: the second tick turns blue.
    .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages", filter: `sender_id=eq.${userId}` }, () => void refreshMessages())
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` }, (payload) => {
      void refreshNotices();
      const type = (payload.new as { type?: string }).type;
      if (type === "request") void refreshFriends();
      if (type === "gift") void refreshGifts();
      if (type === "like" || type === "comment") void refreshPosts();
    })
    .subscribe();
  return () => void client.removeChannel(channel);
}
