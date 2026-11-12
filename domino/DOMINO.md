# Domino oyunu (Ravetill) — təhvil sənədi

Qaydalar mühərriki: `engine.ts` (təmiz TypeScript, asılılıqsız). Test: `engine.test.ts`.
Sınaq: `tsc --target es2020 --module commonjs --strict --outDir out engine.ts engine.test.ts && node out/engine.test.js`
Son nəticə: 3600 təsadüfi matç xətasız (yalnız mühərrik məntiqi; brauzer/telefon/canlı DB ilə sınaq yoxdur).

## Layihə məqsədi
- Saytın oyunlar bölməsində 3-cü oyunun yerinə Domino (hazırkı 3-cü oyunun nə olacağı hələ soruşulmayıb).
- 2-4 nəfər onlayn, bir neçə masa, giriş tam pulsuz.
- Rejimlər: **Azərbaycan 101** və **Telefon 365** (masa sahibi seçir).
- Yalnız qeydiyyatlı oyunçular üçün reytinq cədvəli, yarış, müxtəlif medallar. Komandaların da ümumi xalı reytinqdə olur.
- Komanda üzvləri bir-birini dəvət edib öz masasına çağıra bilir.
- Masada canlı səsli söhbət (WebRTC) və yazılı çat. Çatda "Ya Allah Bismillah" kimi ifadələr olsun deyə dəyişiklik istənilib.
- Dizayn: Canva ilə realistik domino daşları, müxtəlif arxa fonlar, TikTok reklamı üçün maraqlı loqo. İnternetdəki ən yaxşı domino oyunlarının yaxşı cəhətləri götürülsün (dizayn kopyalanmasın).
- Qalıq səhv istəmir: istifadəçi özü bir-bir yoxlayacaq. Dürüst bildir: yalnız syntax/tip/test skripti yoxlanılıb.

## Ümumi qaydalar
- 28 daş (0-0 … 6-6), hər oyunçuya 7. 4 nəfərdə bazar yoxdur, 3 nəfərdə 7 daş, 2 nəfərdə 14 daş bazarda.
- 2 və 3 nəfərlik oyunda qaydalar eynidir.
- Əlində gediş olsa da bazardan çəkmək olar (istifadəçi təsdiqlədi, paket-IZ); növbə oyunçuda qalır. Gediş yoxdursa və bazar boş deyilsə çəkməlidir. Bazar boşdursa pas. Gediş varkən pas olmaz.
- 101-də bazardan **2-2**, 365-də **1-1** çəkilir (bazarda 1 qalıbsa 1).
- Hamı ardıcıl pas edərsə, raund blokla bitir.
- 4 nəfərdə standart: **2x2 komanda**, qarşılıqlı oturanlar (oyunçu 0+2, 1+3) bir komandadır. Oyunçu ayarlarından komandasız seçmək olar. Komanda xalları birlikdə sayılır.

## 101
- Başlayan: **1-1 olan oyunçu**; yoxdursa 2-2 … 6-6 sırası ilə. Heç kimdə qoşa yoxdursa yenidən payla.
- Raundu əli ilk boşalan qazanır. Rəqiblərin əlində qalan daşların cəmi qalibin komandasına xal yazılır.
- Blok: əlində az qalan komanda qalib, xal = rəqiblərin əlindəki daşların tam cəmi (istifadəçi təsdiqlədi, paket-JA; əvvəl fərq idi). Bərabərlikdə xal yoxdur.
- **101-ə ilk çatan qalib olur.**

## Telefon 365
- Başlayan: **3-2 daşı olan**, o daşla başlanır (ilk hamlədə 5 xal yazılır). 3-2 heç kimdə yoxdursa 1-1 qoşa olan, sonra 2-2 … 6-6.
- **Spinner** = yanına ilk daş qoyulan qoşa (istifadəçi təsdiqlədi, paket-HK). İki ucda qoşa olsa da, hansına əvvəl daş bitişdirilsə, 4 tərəfli yalnız o olur; digər qoşalar adi qalır. Sol və sağ tərəfə daş qoyulandan sonra yuxarı və aşağı da açılır.
- Hər hamlədən sonra açıq uclardakı rəqəmlərin cəmi (qoşa uc iki dəfə) **5-ə bölünürsə**, cəm qədər xal yazılır (5, 10 … 35). Spinnerin yuxarı/aşağı tərəfi yalnız ora daş qoyulubsa sayılır: 2 tərəfdə daş → 2 ucun cəmi, 3 → 3, 4 → 4.
- **Birdəfəyə 35 (və ya daha çox) xal yazdıran komanda dərhal qalib olur**, hədəfi gözləmək lazım deyil. Tək oyunçudursa o qalib olur.
- Hədəf (masa sahibi seçir): **365, 355 və ya 255**. Hədəfə ilk çatan qalib olur.
- **Raund sonu bonusu (300 qaydası, istifadəçi təsdiqlədi):**
  - Əl boşalanda: əli boşalanın komandasına rəqiblərin əlindəki daşların cəmi yazılır.
  - Blokda: əlində az qalan komandaya rəqiblərin cəmi yazılır. Bərabərlikdə xal yoxdur.
  - Yalnız komandanın xalı **300-dən az** olanda (bonusdan əvvəlki xala baxılır; 290 + 40 = 330 ola bilər). Bonus hədəfə çatdırırsa matç bitir.
  - Həmişə yuxarı 5-ə yuvarlaq (paket-HL): 1-4 → 5, 6-9 → 10, 11-14 → 15; 5-ə bölünən olduğu kimi qalır.
  - Kodda: `engine.ts` (`bonus365`, `round5`), SQL-də `domino__bonus365`.
- 5 və 35 xal qaydası "ağ ağ ağ və 5" cümləsi: cəm 5-ə bölünmürsə xal yoxdur — bu qəbul edilib.

## Mühərrikdəki fərziyyələr (istifadəçi təsdiq etməyib)
- Spinner-in yuxarı/aşağı qolları yalnız sol və sağ tərəfə daş qoyulandan sonra açılır.

## İş mərhələləri
1. Mühərrik (hazırdır, 365 bonus qaydası daxil).
2. DB (Supabase): masalar, oyun vəziyyəti, reytinq (komanda xalı daxil), medallar, komanda dəvətləri. SQL `paket-XX.sql` kimi verilir, istifadəçi SQL Editor-da işlədir. Əvvəl `-bax.sql` ilə mövcud sxemi oxu.
3. Oyun ekranı və masa siyahısı (`/games` səhifəsi, 3-cü oyunun yeri).
4. Yazılı çat, səsli söhbət (WebRTC; 4 nəfərə qədər mesh, TURN lazım ola bilər). Realtime istifadəsi artır (Supabase grace period 11 noyabr 2026).
5. Canva ilə dizayn və loqo (Canva bağlantısı qurulub; kreslo nümunələri hazırlanmışdı, bu domino ilə əlaqəli deyil).

## Qaydalar (layihə üçün)
- Qeyri-müəyyən/riskli: əvvəl "anladığım budur" yaz, "bəli" gözlə.
- Xahiş olunmayana toxunma. Git push etmə (deploy istifadəçinin kompüterindən `deploy.ps1` ilə).
- Hər dəfə: yalnız syntax/tip/test yoxlanılıb, brauzer/telefon/canlı DB ilə sınaq yoxdur.

## Dizayn qərarı (istifadəçi təsdiqlədi: "bu yaxşıdır qalsın")
- Masa fonu: **neon klub** (Canva media id `MAHaJ64nWTI`, 1536x1024). Yaşıl klassik masa (`MAHaJ6-At40`) alternativ kimi saxlanılır; masa sahibi seçə bilər (təklif, təsdiqlənməyib).
- Daş: Canva-dan **boş daş** (`MAHaJ0A6wrE`), **nöqtələri kod çəkir** (28 daşın nöqtə sayı AI ilə səhv çıxa bilər, buna görə AI ilə çəkdirilmir).
- Gizli əllər üçün daş arxası: `MAHaJxW4uGU` (qara, qızıl naxışlı).
- Realistik daş nümunəsi (yalnız istiqamət): `MAHaJxTj324`.
- Maket: `domino/design/domino-neon.html` və `domino-neon.png` (daşlar və panellər kodla çəkilib, masa şəkli kiçik 200px önizləmədir, `table3.png`). Layout (xal paneli, çat, səs düymələri, loqo, 2x2 oturacaq yerləşməsi) bu maketdən götürülsün.
- Tam ölçülü şəkilləri istifadəçi Canva-dan yükləyib verməlidir (agent yalnız 200px önizləməyə çatır). Yoluna: `artifacts/sitename-social/public/domino/`.
- Loqo: DOMINO / RAVETILL qızılı yazı maketdədir, TikTok üçün Canva-da ayrıca hazırlanmalıdır (hələ edilməyib).
