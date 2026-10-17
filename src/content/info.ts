import type { Locale } from "@/types";

type Section = [title: string, body: string];

// About, Help and Contact pages. "{site}" is replaced with the site name.
export const info: Record<Locale, { about: Section[]; help: Section[]; contact: Section[] }> = {
  "az": {
    "about": [
      [
        "{site} nədir",
        "{site} dostlarla ünsiyyət qurmaq, paylaşım etmək, video və musiqi paylaşmaq, hədiyyə göndərmək və birlikdə əylənmək üçün sosial şəbəkədir."
      ],
      [
        "Nə edə bilərsən",
        "Profil yarat, dost tap, yazış, səsli mesaj göndər, qruplara qoşul, hekayə, şəkil, video və Reels paylaş, mahnı dinlə və yaxınlarına hədiyyə göndər."
      ],
      [
        "Təhlükəsizlik",
        "Sayt yalnız 18 yaşdan yuxarı şəxslər üçündür. Məxfilik tənzimləmələri, qara siyahı və şikayət düyməsi ilə kimin səninlə əlaqə qura biləcəyini özün idarə edirsən."
      ]
    ],
    "help": [
      [
        "Hesabı necə açım?",
        "Qeydiyyat səhifəsində adını, e-poçtunu, doğum tarixini və şifrəni yaz. Qeydiyyat üçün 18 yaşın tamam olmalıdır."
      ],
      [
        "Şifrəmi unutmuşam",
        "Giriş səhifəsində «Şifrəni unutmusan?» bölməsinə keç və e-poçtunu yaz. Sənə şifrəni yeniləmək üçün link göndəriləcək."
      ],
      [
        "Kimin mənə yaza biləcəyini necə məhdudlaşdırım?",
        "Tənzimləmələr → Məxfilik bölməsində profilini, mesajları və dostluq sorğularını «Hamı», «Yalnız dostlar» və ya «Heç kim» üçün aça bilərsən."
      ],
      [
        "Narahat edən istifadəçi ilə nə edim?",
        "Onun profilində üç nöqtə menyusundan «Blokla» seç. Bloklanan şəxs səni görə, sənə yaza və hədiyyə göndərə bilməz. Qaydaları pozursa, «Şikayət et» düyməsini bas."
      ],
      [
        "Xal nədir və nəyə lazımdır?",
        "Xal hədiyyə göndərmək üçün istifadə olunur. Balansını Hədiyyələr bölməsində görə və artıra bilərsən."
      ],
      [
        "Hesabımı necə silim?",
        "Tənzimləmələr → Hesab → «Hesabı sil». Bu zaman bütün paylaşımların, mesajların və faylların həmişəlik silinir və geri qaytarıla bilməz."
      ]
    ],
    "contact": [
      [
        "Bizə yaz",
        "Sual, təklif və ya problem olarsa, bizimlə əlaqə saxla. Müraciətlərə adətən bir neçə iş günü ərzində cavab veririk."
      ],
      [
        "Qayda pozuntusu",
        "Uyğunsuz paylaşım və ya istifadəçi görsən, ən sürətli yol yerindəcə «Şikayət et» düyməsini basmaqdır: müraciət birbaşa moderatorlara çatır."
      ]
    ]
  },
  "tr": {
    "about": [
      [
        "{site} nedir",
        "{site}; arkadaşlarla iletişim kurmak, paylaşım yapmak, video ve müzik paylaşmak, hediye göndermek ve birlikte eğlenmek için bir sosyal ağdır."
      ],
      [
        "Neler yapabilirsin",
        "Profil oluştur, arkadaş bul, mesajlaş, sesli mesaj gönder, gruplara katıl, hikâye, fotoğraf, video ve Reels paylaş, şarkı dinle ve sevdiklerine hediye gönder."
      ],
      [
        "Güvenlik",
        "Site yalnızca 18 yaşından büyükler içindir. Gizlilik ayarları, kara liste ve şikâyet düğmesiyle seninle kimin iletişim kurabileceğini sen belirlersin."
      ]
    ],
    "help": [
      [
        "Nasıl hesap açarım?",
        "Kayıt sayfasında adını, e-postanı, doğum tarihini ve şifreni yaz. Kayıt için 18 yaşını doldurmuş olman gerekir."
      ],
      [
        "Şifremi unuttum",
        "Giriş sayfasında «Şifreni mi unuttun?» bölümüne geç ve e-postanı yaz. Şifreni yenilemen için bir bağlantı gönderilir."
      ],
      [
        "Bana kimin yazabileceğini nasıl sınırlarım?",
        "Ayarlar → Gizlilik bölümünde profilini, mesajları ve arkadaşlık isteklerini «Herkes», «Yalnızca arkadaşlar» veya «Hiç kimse» olarak ayarlayabilirsin."
      ],
      [
        "Rahatsız eden bir kullanıcıyla ne yapmalıyım?",
        "Profilindeki üç nokta menüsünden «Engelle»yi seç. Engellenen kişi seni göremez, sana yazamaz ve hediye gönderemez. Kuralları çiğniyorsa «Şikâyet et» düğmesine bas."
      ],
      [
        "Puan nedir, ne işe yarar?",
        "Puan hediye göndermek için kullanılır. Bakiyeni Hediyeler bölümünde görebilir ve artırabilirsin."
      ],
      [
        "Hesabımı nasıl silerim?",
        "Ayarlar → Hesap → «Hesabı sil». Tüm paylaşımların, mesajların ve dosyaların kalıcı olarak silinir ve geri alınamaz."
      ]
    ],
    "contact": [
      [
        "Bize yaz",
        "Sorun, önerin veya bir problemin varsa bizimle iletişime geç. Başvurulara genellikle birkaç iş günü içinde yanıt veriyoruz."
      ],
      [
        "Kural ihlali",
        "Uygunsuz bir paylaşım veya kullanıcı görürsen en hızlı yol, yerinde «Şikâyet et» düğmesine basmaktır: başvuru doğrudan moderatörlere ulaşır."
      ]
    ]
  },
  "ru": {
    "about": [
      [
        "Что такое {site}",
        "{site} — социальная сеть для общения с друзьями, публикаций, видео и музыки, подарков и совместного отдыха."
      ],
      [
        "Что можно делать",
        "Создайте профиль, находите друзей, переписывайтесь, отправляйте голосовые сообщения, вступайте в группы, публикуйте истории, фото, видео и Reels, слушайте музыку и дарите подарки близким."
      ],
      [
        "Безопасность",
        "Сайт предназначен только для лиц старше 18 лет. Настройки приватности, чёрный список и кнопка жалобы позволяют вам самим решать, кто может с вами связаться."
      ]
    ],
    "help": [
      [
        "Как создать аккаунт?",
        "На странице регистрации укажите имя, e-mail, дату рождения и пароль. Для регистрации вам должно исполниться 18 лет."
      ],
      [
        "Я забыл пароль",
        "На странице входа откройте раздел «Забыли пароль?» и укажите e-mail. Вам придёт ссылка для смены пароля."
      ],
      [
        "Как ограничить, кто может мне писать?",
        "В разделе Настройки → Приватность можно открыть профиль, сообщения и заявки в друзья для всех, только для друзей или ни для кого."
      ],
      [
        "Что делать с назойливым пользователем?",
        "В меню с тремя точками в его профиле выберите «Заблокировать». Заблокированный пользователь не сможет видеть вас, писать вам и отправлять подарки. Если он нарушает правила, нажмите «Пожаловаться»."
      ],
      [
        "Что такое баллы и зачем они нужны?",
        "Баллы используются для отправки подарков. Баланс можно посмотреть и пополнить в разделе «Подарки»."
      ],
      [
        "Как удалить аккаунт?",
        "Настройки → Аккаунт → «Удалить аккаунт». Все ваши публикации, сообщения и файлы будут удалены навсегда без возможности восстановления."
      ]
    ],
    "contact": [
      [
        "Напишите нам",
        "Если у вас есть вопрос, предложение или проблема, свяжитесь с нами. Обычно мы отвечаем в течение нескольких рабочих дней."
      ],
      [
        "Нарушение правил",
        "Если вы увидели неподобающую публикацию или пользователя, быстрее всего нажать «Пожаловаться» прямо на месте: обращение сразу попадает к модераторам."
      ]
    ]
  },
  "en": {
    "about": [
      [
        "What {site} is",
        "{site} is a social network for talking with friends, posting, sharing videos and music, sending gifts and having fun together."
      ],
      [
        "What you can do",
        "Create a profile, find friends, chat, send voice messages, join groups, share stories, photos, videos and Reels, listen to music and send gifts to people you care about."
      ],
      [
        "Safety",
        "The site is for people aged 18 and over only. Privacy settings, the block list and the report button let you decide who can reach you."
      ]
    ],
    "help": [
      [
        "How do I create an account?",
        "On the sign-up page enter your name, email, date of birth and a password. You must be 18 or older to register."
      ],
      [
        "I forgot my password",
        "On the sign-in page open “Forgot password?” and enter your email. You will receive a link to set a new password."
      ],
      [
        "How do I limit who can write to me?",
        "Under Settings → Privacy you can open your profile, messages and friend requests to everyone, friends only, or nobody."
      ],
      [
        "What do I do about someone bothering me?",
        "Open the three-dot menu on their profile and choose “Block”. A blocked person cannot see you, message you or send you gifts. If they break the rules, press “Report”."
      ],
      [
        "What are coins for?",
        "Coins are used to send gifts. You can see and top up your balance in the Gifts section."
      ],
      [
        "How do I delete my account?",
        "Settings → Account → “Delete account”. All your posts, messages and files are removed permanently and cannot be restored."
      ]
    ],
    "contact": [
      [
        "Write to us",
        "If you have a question, a suggestion or a problem, get in touch. We usually reply within a few working days."
      ],
      [
        "Rule violations",
        "If you see an inappropriate post or user, the fastest way is to press “Report” right there: it goes straight to the moderators."
      ]
    ]
  },
  "ka": {
    "about": [
      [
        "რა არის {site}",
        "{site} არის სოციალური ქსელი მეგობრებთან ურთიერთობისთვის, პოსტებისთვის, ვიდეოსა და მუსიკის გაზიარებისთვის, საჩუქრების გასაგზავნად და ერთად გასართობად."
      ],
      [
        "რისი გაკეთება შეგიძლია",
        "შექმენი პროფილი, იპოვე მეგობრები, მიწერე, გააგზავნე ხმოვანი შეტყობინება, შეუერთდი ჯგუფებს, გააზიარე ისტორიები, ფოტოები, ვიდეოები და Reels, მოუსმინე მუსიკას და გაუგზავნე საჩუქრები ახლობლებს."
      ],
      [
        "უსაფრთხოება",
        "საიტი განკუთვნილია მხოლოდ 18 წელს გადაცილებული პირებისთვის. კონფიდენციალურობის პარამეტრებით, შავი სიითა და საჩივრის ღილაკით შენ თვითონ წყვეტ, ვის შეუძლია შენთან დაკავშირება."
      ]
    ],
    "help": [
      [
        "როგორ შევქმნა ანგარიში?",
        "რეგისტრაციის გვერდზე ჩაწერე სახელი, ელფოსტა, დაბადების თარიღი და პაროლი. რეგისტრაციისთვის 18 წელი უნდა გქონდეს შესრულებული."
      ],
      [
        "პაროლი დამავიწყდა",
        "შესვლის გვერდზე გახსენი «დაგავიწყდა პაროლი?» და ჩაწერე ელფოსტა. მიიღებ ბმულს პაროლის გასაახლებლად."
      ],
      [
        "როგორ შევზღუდო, ვინ მომწერს?",
        "პარამეტრები → კონფიდენციალურობა განყოფილებაში შეგიძლია პროფილი, შეტყობინებები და მეგობრობის მოთხოვნები გახსნა ყველასთვის, მხოლოდ მეგობრებისთვის ან არავისთვის."
      ],
      [
        "რა ვქნა, თუ მომხმარებელი მაწუხებს?",
        "მის პროფილზე სამი წერტილის მენიუში აირჩიე «დაბლოკვა». დაბლოკილი ადამიანი ვერ გხედავს, ვერ მოგწერს და საჩუქარს ვერ გამოგიგზავნის. თუ წესებს არღვევს, დააჭირე «საჩივარს»."
      ],
      [
        "რა არის ქულა და რისთვის არის საჭირო?",
        "ქულა გამოიყენება საჩუქრების გასაგზავნად. ბალანსის ნახვა და შევსება შეგიძლია საჩუქრების განყოფილებაში."
      ],
      [
        "როგორ წავშალო ანგარიში?",
        "პარამეტრები → ანგარიში → «ანგარიშის წაშლა». ყველა შენი პოსტი, შეტყობინება და ფაილი სამუდამოდ წაიშლება და აღდგენა შეუძლებელია."
      ]
    ],
    "contact": [
      [
        "მოგვწერე",
        "თუ გაქვს შეკითხვა, წინადადება ან პრობლემა, დაგვიკავშირდი. ჩვეულებრივ რამდენიმე სამუშაო დღეში ვპასუხობთ."
      ],
      [
        "წესების დარღვევა",
        "თუ შეუფერებელ პოსტს ან მომხმარებელს ნახავ, ყველაზე სწრაფი გზაა ადგილზევე «საჩივრის» ღილაკზე დაჭერა: მიმართვა პირდაპირ მოდერატორებთან მიდის."
      ]
    ]
  }
};
