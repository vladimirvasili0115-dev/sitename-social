# Ravetill (ravetill.com) və Butulka oyunu — layihə qaydaları

İstifadəçi Azərbaycan dilində yazır. Cavablar qısa və Azərbaycan dilində olsun.

## İş qaydaları
- Sorğu qeyri-müəyyən və ya riskli olarsa: əvvəl "anladığım budur" yaz, "bəli" gözlə, sonra et.
- Xahiş olunmayan heç nəyə toxunma. "Başqa heç nə etmə" ciddi qaydadır.
- Hər dəyişiklikdən sonra açıq de: yalnız syntax və tiplər yoxlanıb (brauzer, telefon, canlı DB ilə sınaq yoxdur), əgər həqiqətən yoxlanmayıbsa.
- Git push etmə. Deploy istifadəçinin kompüterindən gedir: `powershell -ExecutionPolicy Bypass -File C:\Users\andro\deploy.ps1 N "mesaj"`.
- Gizli açar (service_role və s.) istəmə, repoya yazma.

## Texnologiya
- Next.js statik export, React 19, TypeScript, Tailwind, Supabase (RPC, RLS, SECURITY DEFINER, pg_cron, Realtime), lucide-react.
- Sayt kodu: `artifacts/sitename-social/src`. Əsas oyun faylı: `src/components/bottle/BottleGame.tsx`.
- Tip yoxlaması: `tsc` (typecheck skripti). Syntax yoxlaması da edilir.

## Verilənlər bazası
- Canlı Supabase DB əsasdır. Yerli SQL faylları köhnə ola bilər.
- Canlı funksiyanı oxumaq üçün yalnız oxuyan `paket-XX-bax.sql` yaz, istifadəçi SQL Editor-da işlədib nəticəni göndərir.
- Dəyişiklik SQL-i `paket-XX.sql` kimi verilir. İstifadəçi Supabase SQL Editor-da Ctrl+A, Run edir, SONRA deploy.ps1 işlədir. SQL həmişə saytdan əvvəl.
- Məbləğlər coin ilə (100 coin = 1 ₼). `bottle_wallets` ürək, `wallets` manat balansıdır.
- Moderator = `admins` cədvəlində `is_owner = false`. Sahib = `is_owner()`.

## Butulka qaydaları (indiki vəziyyət)
- Masa siyahısı: yalnız ≥1 nəfəri olan masalar, VIP+ həmişə, öz masa, və 3 dəq oturulmuş boş masa (`stayed`, localStorage `bottle-stayed`, 6 saat).
- "Təsadüfi masa" düyməsi: əvvəl dolu masalar, sonra gizli boş masalar sıra ilə, `randomSeen` ref.
- TOP-10 adları sarı (`topNameClass`), TOP-3 animasiyalı qızılı. Admin rənglərindən üstündür.
- Təpik qiyməti 750 ilə məhdud (`bottle_kick_cost`, `bottle_kick_defend_price`, `bottle_save`).
- Moderator balans yükləyə bilir, limit 50 ₼ (`admin_grant_coins`, SQL tərəfində 5000 coin).

## Açıq məsələlər (istifadəçi cavabı gözlənilir)
- Moderator limiti 50 ₼ qalsın, yoxsa dəyişsin? Sahibə görünən "Balans yükləmələri" jurnalı (`admin_coin_log`) istənilib-istənilmədiyi bəlli deyil.
- Sürətli hədiyyə axınında masa dəyişəndə köhnə masanın hədiyyələri yeni masaya keçir. Əvvəl istifadəçidən detallar soruşulmalı (kim görür, tez-tez, ekran görüntüsü).
- VIP+ masa fonu seçimi: kim seçir, kim görür, hazır siyahı yoxsa yükləmə, perspektiv. Hələ kod yazılmayıb.
- Künc hədiyyələrinin sağ çərçivə düzəlişi (14 hədiyyə) sonraya saxlanıb.
- İstifadəçi tərəfində təsdiqlənməmiş SQL: paket-GR, GW, HC, HE, HF, HH. GX və GY işə salınmamalıdır (köhnəlib).
- Fikirlər (təsdiqlənməyib): Realtime istifadəsini azaltmaq (Supabase grace period 11 noyabr 2026), deploy-dan sonra avtomatik yeniləmə bildirişi.

## Domino
- Yeni oyun (101 və Telefon 365): `domino/DOMINO.md` sənədini oxu. Mühərrik: `domino/engine.ts`, test: `domino/engine.test.ts`.
- 365-də "300 qaydası" təsdiqlənib və yazılıb (raund sonu bonusu yalnız komanda xalı 300-dən az olanda, 5-ə yuvarlaq). Təfsilat: `domino/DOMINO.md`.
