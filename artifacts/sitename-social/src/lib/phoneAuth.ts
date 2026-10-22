// Registering and logging in with a phone number, without an SMS code (for now).
// The account is stored under a made-up e-mail address that is worked out from the number, so the normal e-mail + password login keeps working.
// The address is a hash of the number (not the number itself), because the username shown on the site may be taken from it.
export function normalizePhone(raw: string): string | null {
  const text = raw.trim();
  let digits = text.replace(/\D/g, "");
  if (!digits) return null;
  if (!text.startsWith("+")) {
    if (digits.startsWith("00")) digits = digits.slice(2);
    else if (digits.startsWith("0")) digits = `994${digits.slice(1)}`; // 050 123 45 67 -> Azerbaijan
    else if (digits.length === 9) digits = `994${digits}`; // 50 123 45 67 -> Azerbaijan
  }
  if (digits.startsWith("994") && digits.length !== 12) return null;
  return /^[1-9]\d{8,14}$/.test(digits) ? digits : null;
}

export async function phoneEmail(digits: string): Promise<string> {
  const bytes = new TextEncoder().encode(`nudepart-phone:${digits}`);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  const hex = Array.from(new Uint8Array(hash)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `p${hex.slice(0, 20)}@phone.nudepart.com`;
}

export const looksLikePhone = (value: string) => !value.includes("@") && /\d/.test(value);

type Words = { email: string; phone: string; phoneLabel: string; phoneHint: string; phoneError: string; loginLabel: string; howTo: string };
const words: Record<string, Words> = {
  az: { email: "E-poçt", phone: "Telefon", phoneLabel: "Telefon nömrəsi", phoneHint: "Azərbaycan: 050 123 45 67. Başqa ölkə: + və ölkə kodu ilə yaz. Nömrə hələlik SMS ilə təsdiqlənmir, şifrəni unutsan telefonla bərpa olunmur.", phoneError: "Telefon nömrəsi düzgün deyil", loginLabel: "E-poçt və ya telefon", howTo: "Qeydiyyat üsulu" },
  tr: { email: "E-posta", phone: "Telefon", phoneLabel: "Telefon numarası", phoneHint: "Azerbaycan: 050 123 45 67. Başka ülke: + ve ülke koduyla yaz. Numara şimdilik SMS ile doğrulanmıyor, şifreni unutursan telefonla sıfırlanamaz.", phoneError: "Telefon numarası geçersiz", loginLabel: "E-posta veya telefon", howTo: "Kayıt yöntemi" },
  ru: { email: "E-mail", phone: "Телефон", phoneLabel: "Номер телефона", phoneHint: "Азербайджан: 050 123 45 67. Другая страна: введи с + и кодом страны. Номер пока не подтверждается по SMS, при потере пароля восстановить по телефону нельзя.", phoneError: "Неверный номер телефона", loginLabel: "E-mail или телефон", howTo: "Способ регистрации" },
  en: { email: "E-mail", phone: "Phone", phoneLabel: "Phone number", phoneHint: "Azerbaijan: 050 123 45 67. Other countries: start with + and the country code. The number is not confirmed by SMS yet, and a forgotten password cannot be reset by phone.", phoneError: "The phone number is not valid", loginLabel: "E-mail or phone", howTo: "Sign up with" },
  ka: { email: "ელ-ფოსტა", phone: "ტელეფონი", phoneLabel: "ტელეფონის ნომერი", phoneHint: "აზერბაიჯანი: 050 123 45 67. სხვა ქვეყანა: დაიწყე + და ქვეყნის კოდით. ნომერი ჯერ SMS-ით არ მოწმდება, დავიწყებული პაროლი ტელეფონით ვერ აღდგება.", phoneError: "ტელეფონის ნომერი არასწორია", loginLabel: "ელ-ფოსტა ან ტელეფონი", howTo: "რეგისტრაციის მეთოდი" },
};
export const phoneWords = (locale: string): Words => words[locale] ?? words.en;
