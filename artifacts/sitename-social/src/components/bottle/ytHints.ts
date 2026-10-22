// Why the YouTube search failed, in words a player can act on. The reason comes straight from YouTube's answer.
export async function ytReason(res: Response): Promise<string> {
  let reason = `http${res.status}`;
  try {
    const body = (await res.clone().json()) as { error?: { status?: string; errors?: { reason?: string }[] } };
    reason = body.error?.errors?.[0]?.reason ?? body.error?.status ?? reason;
  } catch { /* the answer was not JSON */ }
  if (typeof console !== "undefined") console.warn("[youtube] search failed:", res.status, reason);
  return reason;
}
const text: Record<string, { quota: string; key: string; other: string }> = {
  az: { quota: "YouTube-un gündəlik axtarış limiti bitib. Sabah yenilənir. Hələlik mahnının YouTube linkini yapışdıra bilərsən.", key: "YouTube açarı bu ünvana icazə vermir (açar ayarlarını yoxla).", other: "YouTube xətası" },
  tr: { quota: "YouTube'un günlük arama limiti doldu. Yarın yenilenir. Şimdilik şarkının YouTube bağlantısını yapıştırabilirsin.", key: "YouTube anahtarı bu adrese izin vermiyor (anahtar ayarlarını kontrol et).", other: "YouTube hatası" },
  ru: { quota: "Дневной лимит поиска YouTube исчерпан. Завтра обновится. Пока можно вставить ссылку на песню с YouTube.", key: "Ключ YouTube не разрешает этот адрес (проверь настройки ключа).", other: "Ошибка YouTube" },
  en: { quota: "YouTube's daily search limit has been reached. It resets tomorrow. For now you can paste a YouTube link to the song.", key: "The YouTube key does not allow this address (check the key settings).", other: "YouTube error" },
  ka: { quota: "YouTube-ის დღიური ძიების ლიმიტი ამოიწურა. ხვალ განახლდება. ჯერ შეგიძლია ჩასვა სიმღერის YouTube ბმული.", key: "YouTube-ის გასაღები ამ მისამართს არ აძლევს უფლებას (შეამოწმე გასაღების პარამეტრები).", other: "YouTube-ის შეცდომა" },
};
export function ytHint(locale: string, reason: string): string {
  const words = text[locale] ?? text.en;
  const quota = /quota|dailyLimit|rateLimit/i.test(reason);
  const key = /referer|keyInvalid|API_KEY|accessNotConfigured|forbidden|PERMISSION/i.test(reason);
  return `${quota ? words.quota : key ? words.key : words.other} (${reason})`;
}
