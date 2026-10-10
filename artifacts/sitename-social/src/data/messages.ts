import type { Conversation, Message } from "@/types";

const now = Date.now();
let counter = 0;
const msg = (from: Message["from"], text: string, minutesAgo: number): Message => ({ id: `m${++counter}`, from, text, at: now - minutesAgo * 60_000 });

export const initialConversations: Conversation[] = [
  { userId: "u1", unread: 2, messages: [
    msg("them", "Salam! Necəsən?", 190), msg("me", "Salam, yaxşıyam. Sən necəsən?", 185),
    msg("them", "Mən də yaxşı. Axşam bulvara çıxırıq, gəlirsən?", 12), msg("them", "Saat 8-də görüşək 🙂", 11),
  ] },
  { userId: "u2", unread: 0, messages: [
    msg("me", "Şəkilləri göndərə bilərsən?", 1500), msg("them", "Əlbəttə, axşam atacam.", 1490), msg("me", "Çox sağ ol!", 1485),
  ] },
  { userId: "u7", unread: 1, messages: [msg("them", "Sabahkı oyuna gəlirsən?", 95)] },
  { userId: "u3", unread: 0, messages: [
    msg("them", "Ad günün mübarək! 🎉", 4400), msg("me", "Təşəkkür edirəm, Nigar!", 4380),
  ] },
  { userId: "u9", unread: 0, messages: [msg("me", "Layihə barədə sabah danışaq.", 7300), msg("them", "Oldu, danışarıq.", 7290)] },
];
