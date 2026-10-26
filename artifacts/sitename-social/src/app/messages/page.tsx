"use client";
import { useEffect, useState } from "react";
import { MessagesSquare } from "lucide-react";
import { useTranslation } from "@/i18n/useTranslation";
import { Card } from "@/components/ui/Card";
import { useMessages } from "@/components/messages/useMessages";
import { ConversationList } from "@/components/messages/ConversationList";
import { ChatPane } from "@/components/messages/ChatPane";
import { NewChatModal } from "@/components/messages/NewChatModal";
import { useFriends } from "@/components/friends/useFriends";

export default function MessagesPage() {
  const { t } = useTranslation();
  const { chats, open, send, removeMessage, clear } = useMessages();
  const { friends } = useFriends();
  const [picking, setPicking] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = chats.find((chat) => chat.userId === activeId);
  const openChat = (userId: string) => {
    open(userId);
    setActiveId(userId);
  };

  useEffect(() => {
    const userId = new URLSearchParams(window.location.search).get("u");
    if (userId) openChat(userId);
    // The envelope in the header opens the newest unread chat, also when this page is already open.
    const onOpen = (event: Event) => { const id = (event as CustomEvent<string>).detail; if (id) openChat(id); };
    window.addEventListener("open-chat", onOpen);
    return () => window.removeEventListener("open-chat", onOpen);
    // Runs once on mount to honour a ?u= link from the friends page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card className="flex h-[calc(100dvh-196px)] min-h-[420px] overflow-hidden lg:h-[calc(100dvh-136px)]">
      <ConversationList chats={chats} activeId={activeId} onOpen={openChat} onNew={() => setPicking(true)} className={active ? "hidden md:flex" : "flex"} />
      {active ? (
        <ChatPane chat={active} onBack={() => setActiveId(null)} onSend={(input) => send(active.userId, input)} onDelete={(id) => removeMessage(active.userId, id)} onClear={() => void clear(active.userId).then((ok) => { if (ok) setActiveId(null); })} className="flex" />
      ) : (
        <div className="hidden flex-1 flex-col items-center justify-center px-6 text-center md:flex">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-surface-2 text-accent"><MessagesSquare size={24} /></span>
          <h1 className="mt-4 text-lg font-semibold tracking-tight">{t("messages.empty")}</h1>
          <p className="mt-1.5 max-w-xs text-sm leading-6 text-muted">{t("messages.emptyHint")}</p>
        </div>
      )}
      {picking ? <NewChatModal friends={friends} onPick={(userId) => { openChat(userId); setPicking(false); }} onClose={() => setPicking(false)} /> : null}
    </Card>
  );
}
