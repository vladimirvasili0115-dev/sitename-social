import type { Locale } from "@/types";

// Template legal text. Have a lawyer review it before the site goes live.
export const LEGAL_UPDATED = "10.10.2026";
type Section = [title: string, body: string];

export const legal: Record<Locale, { terms: Section[]; privacy: Section[] }> = {
  "az": {
    "terms": [
      [
        "Ümumi müddəalar",
        "{site} istifadəçilərin ünsiyyət qurduğu, paylaşım etdiyi, hədiyyə göndərdiyi və oyun oynadığı sosial şəbəkədir. Saytda qeydiyyatdan keçməklə və ya ondan istifadə etməklə bu qaydaları tam qəbul etmiş olursunuz. Qaydalarla razı deyilsinizsə, saytdan istifadə etməyin."
      ],
      [
        "Yaş həddi",
        "Sayt yalnız 18 yaşı tamam olmuş şəxslər üçündür. Qeydiyyat zamanı doğum tarixinizi düzgün göstərməlisiniz. Yaşı 18-dən az olan şəxsə aid olduğu müəyyən edilən hesab xəbərdarlıq edilmədən silinir."
      ],
      [
        "Hesab və təhlükəsizlik",
        "Hər şəxs yalnız bir hesab aça bilər və hesab başqasına verilə bilməz. Düzgün məlumat verməyə, şifrənizi gizli saxlamağa və hesabınıza icazəsiz giriş barədə dərhal məlumat verməyə borclusunuz. Hesabınızdan edilən bütün əməliyyatlara görə özünüz cavabdehsiniz."
      ],
      [
        "Davranış qaydaları",
        "Digər istifadəçilərə hörmətlə yanaşın. Təhqir, hədə, təqib, şantaj, ayrı-seçkilik və nifrət nitqi qadağandır. Başqasının adından çıxış etmək, saxta hesab yaratmaq, spam və icazəsiz reklam göndərmək, saytın işinə müdaxilə etmək və ya məlumatları avtomatik toplamaq olmaz."
      ],
      [
        "Qadağan olunmuş məzmun",
        "Pornoqrafik məzmun, zorakılığı və ya terroru təbliğ edən, narkotik, silah və qanunsuz xidmətləri reklam edən, yetkinlik yaşına çatmayanlara zərər verən, fırıldaqçılıq məqsədi daşıyan və başqasının şəxsi məlumatını icazəsiz açıqlayan məzmun paylaşmaq qadağandır."
      ],
      [
        "Tanışlıq və oyunlarda təhlükəsizlik",
        "Saytda tanış olduğunuz insanların kimliyini yoxlamırıq. Şəxsi məlumatlarınızı, ünvanınızı və bank məlumatlarınızı tanımadığınız şəxslərlə paylaşmayın, pul göndərməyin. Real görüşləri ictimai yerdə təyin edin. Şübhəli davranışı bloklama və şikayət vasitəsilə bildirin."
      ],
      [
        "Məzmun və müəllif hüquqları",
        "Paylaşdığınız məzmunun hüquqları sizdə qalır. Onu saytda göstərmək, saxlamaq və texniki cəhətdən emal etmək üçün bizə əvəzsiz, qeyri-müstəsna icazə verirsiniz. Yalnız hüququ sizə məxsus olan və ya paylaşmağa icazəniz olan məzmunu yerləşdirin. Saytın adı, loqosu, dizaynı və hədiyyə rəsmləri bizə məxsusdur."
      ],
      [
        "Xallar, hədiyyələr və ödənişlər",
        "Xallar saytın daxili vahididir, real pul deyil və nağdlaşdırıla bilməz. Xallar yalnız sayt daxilində hədiyyə və digər xidmətlər üçün istifadə olunur. Ödənişlər ödəniş provayderi vasitəsilə aparılır. Alınmış xallar və göndərilmiş hədiyyələr qanunla nəzərdə tutulan hallar istisna olmaqla geri qaytarılmır. Qiymətlər dəyişdirilə bilər."
      ],
      [
        "Şikayət və moderasiya",
        "Qaydaları pozan məzmun və ya istifadəçi barədə şikayət edə bilərsiniz. Şikayətlərə baxılır və zəruri hallarda məzmun silinir, hesab məhdudlaşdırılır. Moderasiya qərarı ilə razı deyilsinizsə, sayt administrasiyasına müraciət edə bilərsiniz."
      ],
      [
        "Məsuliyyətin məhdudlaşdırılması",
        "Sayt \"olduğu kimi\" təqdim olunur. Fasiləsiz və xətasız işləməsinə zəmanət vermirik. İstifadəçilərin paylaşdığı məzmuna və onların sayt daxilində və ya xaricində davranışına görə məsuliyyət daşımırıq. Bu, qanunla məhdudlaşdırıla bilməyən hüquqlarınıza təsir etmir."
      ],
      [
        "Hesabın dayandırılması və silinməsi",
        "Qaydaları pozan hesablar xəbərdarlıq edilə, müvəqqəti və ya həmişəlik bloklana bilər. Ağır pozuntularda hesab dərhal bağlanır və istifadə olunmamış xallar geri qaytarılmır. Hesabınızı istənilən vaxt tənzimləmələrdən silə bilərsiniz."
      ],
      [
        "Tətbiq olunan qanun və dəyişikliklər",
        "Bu qaydalar Azərbaycan Respublikasının qanunvericiliyi ilə tənzimlənir. Qaydalar yenilənə bilər; əhəmiyyətli dəyişikliklər barədə saytda bildiriş veriləcək. Dəyişiklikdən sonra saytdan istifadəni davam etdirmək yeni qaydaları qəbul etmək deməkdir."
      ]
    ],
    "privacy": [
      [
        "Topladığımız məlumatlar",
        "Qeydiyyat məlumatları: ad, e-poçt, cins, doğum tarixi, şəhər. Profil məlumatları: şəkil, status və özünüz haqqında yazdıqlarınız. Fəaliyyət: paylaşımlar, şərhlər, bəyənmələr, dostluqlar, qruplar, hədiyyələr və profil baxışları. Texniki məlumatlar: IP ünvanı, cihaz və brauzer növü, giriş vaxtları."
      ],
      [
        "Məlumatlardan istifadə məqsədləri",
        "Hesabınızı yaratmaq və qorumaq, xidmətləri göstərmək, sizə uyğun məzmun və dost tövsiyələri təqdim etmək, bildiriş göndərmək, ödənişləri emal etmək, saxtakarlığın və sui-istifadənin qarşısını almaq, qanuni öhdəlikləri yerinə yetirmək və saytı yaxşılaşdırmaq üçün."
      ],
      [
        "Profilin görünməsi və məxfilik ayarları",
        "Adınız və profil şəkliniz digər istifadəçilərə görünür. Profilinizi, dostlar siyahınızı və hədiyyələrinizi kimin görəcəyini, sizə kimin mesaj yazacağını tənzimləmələrdən seçirsiniz. Görünməz rejim onlayn statusunuzu və profil baxışlarınızı gizlətməyə imkan verir."
      ],
      [
        "Mesajlar",
        "Şəxsi mesajlar yalnız yazışma iştirakçılarına görünür. Mesajlar xidməti göstərmək üçün serverlərimizdə saxlanılır. Şikayət daxil olduqda və ya qanun tələb etdikdə mesajlara təhlükəsizlik məqsədilə baxıla bilər."
      ],
      [
        "Ödəniş məlumatları",
        "Ödənişlər ödəniş provayderinin səhifəsində aparılır. Kart nömrənizi və digər kart məlumatlarınızı biz görmür və saxlamırıq. Bizdə yalnız əməliyyatın məbləği, tarixi və nəticəsi saxlanılır."
      ],
      [
        "Məlumatların üçüncü tərəflərlə paylaşılması",
        "Şəxsi məlumatlarınızı satmırıq. Onları yalnız xidməti göstərməyə kömək edən tərəflərlə (hostinq, ödəniş, e-poçt göndərişi) və yalnız zəruri həcmdə paylaşırıq. Qanuni tələb olduqda məlumat səlahiyyətli dövlət orqanlarına verilə bilər."
      ],
      [
        "Saxlanma müddəti və təhlükəsizlik",
        "Məlumatlarınız hesabınız aktiv olduğu müddətdə saxlanılır. Hesabı sildikdə məlumatlar ağlabatan müddətdə silinir; qanunun tələb etdiyi qeydlər (məsələn ödəniş qeydləri) daha uzun saxlanıla bilər. Şifrələr açıq şəkildə saxlanılmır, bağlantı şifrələnir, lakin heç bir sistem tam təhlükəsizliyə zəmanət vermir."
      ],
      [
        "Kukilər və brauzer yaddaşı",
        "Sayt giriş vəziyyətini, dil və mövzu seçimini və digər ayarları yadda saxlamaq üçün kukilərdən və brauzer yaddaşından istifadə edir. Brauzer ayarlarından onları silə bilərsiniz, lakin bu halda saytın bəzi funksiyaları işləməyə bilər."
      ],
      [
        "Yetkinlik yaşına çatmayanlar",
        "Sayt 18 yaşdan kiçik şəxslər üçün nəzərdə tutulmayıb və biz onlardan bilərəkdən məlumat toplamırıq. Belə bir hesab aşkar edildikdə o, məlumatları ilə birlikdə silinir."
      ],
      [
        "Hüquqlarınız və əlaqə",
        "Məlumatlarınıza baxmaq, onları düzəltmək, silmək, emalına etiraz etmək və hesabınızı bağlamaq hüququnuz var. Əksər əməliyyatları tənzimləmələrdən özünüz edə bilərsiniz; digər sorğular üçün sayt administrasiyasına müraciət edin. Bu siyasət yenilənə bilər, əhəmiyyətli dəyişikliklər barədə saytda bildiriş veriləcək."
      ]
    ]
  },
  "tr": {
    "terms": [
      [
        "Genel hükümler",
        "{site}, kullanıcıların iletişim kurduğu, paylaşım yaptığı, hediye gönderdiği ve oyun oynadığı bir sosyal ağdır. Siteye kaydolarak veya siteyi kullanarak bu kuralları tümüyle kabul etmiş olursunuz. Kuralları kabul etmiyorsanız siteyi kullanmayın."
      ],
      [
        "Yaş sınırı",
        "Site yalnızca 18 yaşını doldurmuş kişiler içindir. Kayıt sırasında doğum tarihinizi doğru girmelisiniz. 18 yaşından küçük birine ait olduğu belirlenen hesap uyarı yapılmadan silinir."
      ],
      [
        "Hesap ve güvenlik",
        "Her kişi yalnızca bir hesap açabilir ve hesap başkasına devredilemez. Doğru bilgi vermek, şifrenizi gizli tutmak ve hesabınıza izinsiz girişi derhal bildirmekle yükümlüsünüz. Hesabınızdan yapılan tüm işlemlerden siz sorumlusunuz."
      ],
      [
        "Davranış kuralları",
        "Diğer kullanıcılara saygılı davranın. Hakaret, tehdit, taciz, şantaj, ayrımcılık ve nefret söylemi yasaktır. Başkasının kimliğine bürünmek, sahte hesap açmak, spam ve izinsiz reklam göndermek, sitenin işleyişine müdahale etmek veya verileri otomatik olarak toplamak yasaktır."
      ],
      [
        "Yasak içerik",
        "Pornografik içerik, şiddeti veya terörü öven, uyuşturucu, silah ve yasa dışı hizmetleri tanıtan, reşit olmayanlara zarar veren, dolandırıcılık amacı taşıyan ve başkasının kişisel bilgilerini izinsiz açıklayan içerik paylaşmak yasaktır."
      ],
      [
        "Tanışma ve oyunlarda güvenlik",
        "Sitede tanıştığınız kişilerin kimliğini doğrulamıyoruz. Kişisel bilgilerinizi, adresinizi ve banka bilgilerinizi tanımadığınız kişilerle paylaşmayın, para göndermeyin. Yüz yüze buluşmaları kalabalık yerlerde yapın. Şüpheli davranışları engelleme ve şikâyet yoluyla bildirin."
      ],
      [
        "İçerik ve telif hakları",
        "Paylaştığınız içeriğin hakları sizde kalır. İçeriği sitede göstermemiz, saklamamız ve teknik olarak işlememiz için bize ücretsiz ve münhasır olmayan bir izin verirsiniz. Yalnızca hakkı size ait olan veya paylaşma izniniz bulunan içeriği yükleyin. Sitenin adı, logosu, tasarımı ve hediye çizimleri bize aittir."
      ],
      [
        "Puanlar, hediyeler ve ödemeler",
        "Puanlar sitenin iç birimidir, gerçek para değildir ve nakde çevrilemez. Puanlar yalnızca site içinde hediye ve diğer hizmetler için kullanılır. Ödemeler ödeme sağlayıcısı aracılığıyla yapılır. Satın alınan puanlar ve gönderilen hediyeler, yasanın öngördüğü durumlar dışında iade edilmez. Fiyatlar değiştirilebilir."
      ],
      [
        "Şikâyet ve moderasyon",
        "Kuralları ihlal eden içerik veya kullanıcıyı şikâyet edebilirsiniz. Şikâyetler incelenir, gerekirse içerik silinir ve hesap kısıtlanır. Moderasyon kararına katılmıyorsanız site yönetimine başvurabilirsiniz."
      ],
      [
        "Sorumluluğun sınırlandırılması",
        "Site \"olduğu gibi\" sunulur. Kesintisiz ve hatasız çalışacağını garanti etmiyoruz. Kullanıcıların paylaştığı içerikten ve site içinde veya dışında davranışlarından sorumlu değiliz. Bu, yasayla sınırlandırılamayan haklarınızı etkilemez."
      ],
      [
        "Hesabın askıya alınması ve silinmesi",
        "Kuralları ihlal eden hesaplar uyarılabilir, geçici veya kalıcı olarak engellenebilir. Ağır ihlallerde hesap derhal kapatılır ve kullanılmamış puanlar iade edilmez. Hesabınızı istediğiniz zaman ayarlardan silebilirsiniz."
      ],
      [
        "Uygulanacak hukuk ve değişiklikler",
        "Bu kurallar Azerbaycan Cumhuriyeti mevzuatına tabidir. Kurallar güncellenebilir; önemli değişiklikler sitede duyurulur. Değişiklikten sonra siteyi kullanmaya devam etmeniz yeni kuralları kabul ettiğiniz anlamına gelir."
      ]
    ],
    "privacy": [
      [
        "Topladığımız veriler",
        "Kayıt bilgileri: ad, e-posta, cinsiyet, doğum tarihi, şehir. Profil bilgileri: fotoğraf, durum ve kendiniz hakkında yazdıklarınız. Etkinlik: paylaşımlar, yorumlar, beğeniler, arkadaşlıklar, gruplar, hediyeler ve profil ziyaretleri. Teknik veriler: IP adresi, cihaz ve tarayıcı türü, giriş zamanları."
      ],
      [
        "Verileri kullanma amaçlarımız",
        "Hesabınızı oluşturmak ve korumak, hizmetleri sunmak, size uygun içerik ve arkadaş önerileri göstermek, bildirim göndermek, ödemeleri işlemek, dolandırıcılığı ve kötüye kullanımı önlemek, yasal yükümlülükleri yerine getirmek ve siteyi geliştirmek için."
      ],
      [
        "Profilin görünürlüğü ve gizlilik ayarları",
        "Adınız ve profil fotoğrafınız diğer kullanıcılara görünür. Profilinizi, arkadaş listenizi ve hediyelerinizi kimin göreceğini, size kimin mesaj yazabileceğini ayarlardan seçersiniz. Görünmez mod, çevrimiçi durumunuzu ve profil ziyaretlerinizi gizlemenizi sağlar."
      ],
      [
        "Mesajlar",
        "Özel mesajları yalnızca yazışmanın tarafları görür. Mesajlar hizmeti sunabilmek için sunucularımızda saklanır. Şikâyet geldiğinde veya yasa gerektirdiğinde mesajlar güvenlik amacıyla incelenebilir."
      ],
      [
        "Ödeme bilgileri",
        "Ödemeler ödeme sağlayıcısının sayfasında yapılır. Kart numaranızı ve diğer kart bilgilerinizi görmüyor ve saklamıyoruz. Bizde yalnızca işlemin tutarı, tarihi ve sonucu saklanır."
      ],
      [
        "Verilerin üçüncü taraflarla paylaşılması",
        "Kişisel verilerinizi satmıyoruz. Verileri yalnızca hizmeti sunmamıza yardımcı olan taraflarla (barındırma, ödeme, e-posta gönderimi) ve yalnızca gerekli ölçüde paylaşırız. Yasal talep hâlinde veriler yetkili makamlara verilebilir."
      ],
      [
        "Saklama süresi ve güvenlik",
        "Verileriniz hesabınız etkin olduğu sürece saklanır. Hesabı sildiğinizde veriler makul bir süre içinde silinir; yasanın gerektirdiği kayıtlar (örneğin ödeme kayıtları) daha uzun saklanabilir. Şifreler açık biçimde tutulmaz, bağlantı şifrelenir; ancak hiçbir sistem tam güvenlik garanti edemez."
      ],
      [
        "Çerezler ve tarayıcı belleği",
        "Site, oturum durumunu, dil ve tema seçimini ve diğer ayarları hatırlamak için çerezleri ve tarayıcı belleğini kullanır. Bunları tarayıcı ayarlarından silebilirsiniz; ancak bu durumda sitenin bazı işlevleri çalışmayabilir."
      ],
      [
        "Reşit olmayanlar",
        "Site 18 yaşından küçükler için tasarlanmamıştır ve onlardan bilerek veri toplamıyoruz. Böyle bir hesap tespit edildiğinde verileriyle birlikte silinir."
      ],
      [
        "Haklarınız ve iletişim",
        "Verilerinize erişme, onları düzeltme, silme, işlenmesine itiraz etme ve hesabınızı kapatma hakkınız vardır. İşlemlerin çoğunu ayarlardan kendiniz yapabilirsiniz; diğer talepler için site yönetimine başvurun. Bu politika güncellenebilir, önemli değişiklikler sitede duyurulur."
      ]
    ]
  },
  "ru": {
    "terms": [
      [
        "Общие положения",
        "{site} — социальная сеть, где пользователи общаются, публикуют записи, дарят подарки и играют. Регистрируясь на сайте или используя его, вы полностью принимаете эти правила. Если вы с ними не согласны, не пользуйтесь сайтом."
      ],
      [
        "Возрастное ограничение",
        "Сайт предназначен только для лиц, достигших 18 лет. При регистрации вы обязаны указать настоящую дату рождения. Аккаунт, принадлежащий лицу младше 18 лет, удаляется без предупреждения."
      ],
      [
        "Аккаунт и безопасность",
        "Один человек может иметь только один аккаунт; передавать его другим нельзя. Вы обязаны указывать достоверные данные, хранить пароль в тайне и сразу сообщать о несанкционированном доступе. За все действия в аккаунте отвечаете вы."
      ],
      [
        "Правила поведения",
        "Относитесь к другим пользователям с уважением. Запрещены оскорбления, угрозы, преследование, шантаж, дискриминация и язык вражды. Нельзя выдавать себя за другого, создавать фейковые аккаунты, рассылать спам и рекламу без разрешения, вмешиваться в работу сайта и автоматически собирать данные."
      ],
      [
        "Запрещённый контент",
        "Запрещено публиковать порнографию, материалы, пропагандирующие насилие или терроризм, рекламу наркотиков, оружия и незаконных услуг, контент, вредящий несовершеннолетним, мошеннические материалы и чужие личные данные без согласия."
      ],
      [
        "Безопасность при знакомствах и в играх",
        "Мы не проверяем личность людей, с которыми вы знакомитесь на сайте. Не сообщайте незнакомым людям личные данные, адрес и банковские реквизиты, не переводите деньги. Личные встречи назначайте в общественных местах. О подозрительном поведении сообщайте через блокировку и жалобу."
      ],
      [
        "Контент и авторские права",
        "Права на опубликованный вами контент остаются за вами. Вы предоставляете нам безвозмездное неисключительное разрешение показывать, хранить и технически обрабатывать его на сайте. Публикуйте только то, на что у вас есть права или разрешение. Название, логотип, дизайн сайта и изображения подарков принадлежат нам."
      ],
      [
        "Баллы, подарки и платежи",
        "Баллы — внутренняя единица сайта; это не деньги, и их нельзя обналичить. Баллы используются только на сайте для подарков и других услуг. Платежи проводятся через платёжного провайдера. Купленные баллы и отправленные подарки не возвращаются, кроме случаев, предусмотренных законом. Цены могут меняться."
      ],
      [
        "Жалобы и модерация",
        "Вы можете пожаловаться на контент или пользователя, нарушающего правила. Жалобы рассматриваются; при необходимости контент удаляется, а аккаунт ограничивается. Если вы не согласны с решением модерации, обратитесь к администрации сайта."
      ],
      [
        "Ограничение ответственности",
        "Сайт предоставляется «как есть». Мы не гарантируем его бесперебойную и безошибочную работу. Мы не отвечаем за контент пользователей и их поведение на сайте и за его пределами. Это не затрагивает ваши права, которые нельзя ограничить по закону."
      ],
      [
        "Блокировка и удаление аккаунта",
        "Аккаунты, нарушающие правила, могут получить предупреждение, временную или постоянную блокировку. При грубых нарушениях аккаунт закрывается сразу, неиспользованные баллы не возвращаются. Удалить свой аккаунт можно в любой момент в настройках."
      ],
      [
        "Применимое право и изменения",
        "Эти правила регулируются законодательством Азербайджанской Республики. Правила могут обновляться; о существенных изменениях мы сообщим на сайте. Продолжая пользоваться сайтом после изменений, вы принимаете новую редакцию."
      ]
    ],
    "privacy": [
      [
        "Какие данные мы собираем",
        "Регистрационные данные: имя, почта, пол, дата рождения, город. Данные профиля: фото, статус и то, что вы пишете о себе. Активность: записи, комментарии, лайки, друзья, группы, подарки и посещения профилей. Технические данные: IP-адрес, тип устройства и браузера, время входа."
      ],
      [
        "Цели использования данных",
        "Чтобы создать и защитить ваш аккаунт, оказывать услуги, показывать подходящий контент и рекомендации друзей, отправлять уведомления, обрабатывать платежи, предотвращать мошенничество и злоупотребления, исполнять требования закона и улучшать сайт."
      ],
      [
        "Видимость профиля и настройки приватности",
        "Ваше имя и фото профиля видны другим пользователям. В настройках вы выбираете, кто видит ваш профиль, список друзей и подарки и кто может вам писать. Режим невидимки позволяет скрыть статус онлайн и посещения профилей."
      ],
      [
        "Сообщения",
        "Личные сообщения видят только участники переписки. Сообщения хранятся на наших серверах, чтобы сервис работал. При жалобе или по требованию закона сообщения могут быть просмотрены в целях безопасности."
      ],
      [
        "Платёжные данные",
        "Оплата проходит на странице платёжного провайдера. Мы не видим и не храним номер вашей карты и другие карточные данные. У нас сохраняются только сумма, дата и результат операции."
      ],
      [
        "Передача данных третьим лицам",
        "Мы не продаём личные данные. Мы передаём их только тем, кто помогает оказывать услугу (хостинг, платежи, рассылка писем), и только в необходимом объёме. По законному требованию данные могут быть переданы уполномоченным государственным органам."
      ],
      [
        "Срок хранения и безопасность",
        "Данные хранятся, пока ваш аккаунт активен. После удаления аккаунта они удаляются в разумный срок; записи, которые требует хранить закон (например, платёжные), могут храниться дольше. Пароли не хранятся в открытом виде, соединение шифруется, однако ни одна система не гарантирует полной безопасности."
      ],
      [
        "Cookie и память браузера",
        "Сайт использует cookie и память браузера, чтобы помнить вход, язык, тему и другие настройки. Вы можете удалить их в настройках браузера, но тогда часть функций сайта может не работать."
      ],
      [
        "Несовершеннолетние",
        "Сайт не предназначен для лиц младше 18 лет, и мы сознательно не собираем их данные. При обнаружении такого аккаунта он удаляется вместе с данными."
      ],
      [
        "Ваши права и связь с нами",
        "Вы вправе просматривать, исправлять и удалять свои данные, возражать против их обработки и закрыть аккаунт. Большинство действий доступно в настройках; с остальными запросами обращайтесь к администрации сайта. Политика может обновляться, о существенных изменениях мы сообщим на сайте."
      ]
    ]
  },
  "en": {
    "terms": [
      [
        "General",
        "{site} is a social network where people talk, share posts, send gifts and play games. By registering or using the site you accept these terms in full. If you do not agree with them, do not use the site."
      ],
      [
        "Age limit",
        "The site is only for people aged 18 or over. You must give your real date of birth when registering. An account found to belong to someone under 18 is deleted without notice."
      ],
      [
        "Account and security",
        "Each person may have only one account, and accounts may not be transferred. You must give accurate information, keep your password secret and tell us at once about any unauthorised access. You are responsible for all activity on your account."
      ],
      [
        "Rules of conduct",
        "Treat other users with respect. Insults, threats, harassment, blackmail, discrimination and hate speech are prohibited. You may not impersonate others, create fake accounts, send spam or unsolicited advertising, interfere with the site or collect data automatically."
      ],
      [
        "Prohibited content",
        "You may not post pornography, content that promotes violence or terrorism, advertising for drugs, weapons or illegal services, content that harms minors, fraudulent material or other people's personal data without consent."
      ],
      [
        "Safety in dating and games",
        "We do not verify the identity of people you meet on the site. Do not share personal details, your address or bank details with strangers, and do not send money. Arrange meetings in public places. Report suspicious behaviour by blocking and reporting the user."
      ],
      [
        "Content and copyright",
        "You keep the rights to what you post. You give us a free, non-exclusive licence to display, store and technically process it on the site. Post only content you own or have permission to share. The site's name, logo, design and gift artwork belong to us."
      ],
      [
        "Coins, gifts and payments",
        "Coins are the site's internal unit; they are not money and cannot be cashed out. Coins can only be used on the site for gifts and other services. Payments are handled by a payment provider. Purchased coins and sent gifts are not refunded except where the law requires. Prices may change."
      ],
      [
        "Reports and moderation",
        "You can report content or a user that breaks the rules. Reports are reviewed, and where necessary content is removed and the account restricted. If you disagree with a moderation decision, contact the site administration."
      ],
      [
        "Limitation of liability",
        "The site is provided \"as is\". We do not guarantee uninterrupted or error-free operation. We are not responsible for users' content or for their behaviour on or off the site. This does not affect rights that cannot be limited by law."
      ],
      [
        "Suspension and deletion",
        "Accounts that break the rules may be warned or blocked temporarily or permanently. For serious violations the account is closed at once and unused coins are not refunded. You can delete your account at any time in settings."
      ],
      [
        "Governing law and changes",
        "These terms are governed by the law of the Republic of Azerbaijan. They may be updated; we will announce significant changes on the site. Continuing to use the site after a change means you accept the new terms."
      ]
    ],
    "privacy": [
      [
        "What we collect",
        "Registration data: name, email, gender, date of birth, city. Profile data: photo, status and what you write about yourself. Activity: posts, comments, likes, friendships, groups, gifts and profile visits. Technical data: IP address, device and browser type, sign-in times."
      ],
      [
        "Why we use it",
        "To create and protect your account, provide the services, show relevant content and friend suggestions, send notifications, process payments, prevent fraud and abuse, meet legal obligations and improve the site."
      ],
      [
        "Profile visibility and privacy settings",
        "Your name and profile photo are visible to other users. In settings you choose who can see your profile, friends list and gifts, and who can message you. Invisible mode lets you hide your online status and profile visits."
      ],
      [
        "Messages",
        "Private messages are visible only to the people in the conversation. Messages are stored on our servers so the service can work. They may be reviewed for safety reasons when a report is received or the law requires it."
      ],
      [
        "Payment data",
        "Payments are made on the payment provider's page. We do not see or store your card number or other card details. We keep only the amount, date and result of the transaction."
      ],
      [
        "Sharing with third parties",
        "We do not sell personal data. We share it only with parties that help us run the service (hosting, payments, email delivery) and only as far as necessary. Data may be disclosed to competent authorities on a lawful request."
      ],
      [
        "Retention and security",
        "Your data is kept while your account is active. When you delete your account it is removed within a reasonable time; records the law requires us to keep (such as payment records) may be kept longer. Passwords are never stored in plain text and connections are encrypted, but no system can guarantee complete security."
      ],
      [
        "Cookies and browser storage",
        "The site uses cookies and browser storage to remember your sign-in, language, theme and other settings. You can clear them in your browser settings, but some features may then stop working."
      ],
      [
        "Minors",
        "The site is not intended for anyone under 18 and we do not knowingly collect their data. If such an account is found, it is deleted together with its data."
      ],
      [
        "Your rights and contact",
        "You can view, correct and delete your data, object to its processing and close your account. Most of this can be done in settings; for other requests contact the site administration. This policy may be updated, and we will announce significant changes on the site."
      ]
    ]
  },
  "ka": {
    "terms": [
      [
        "ზოგადი დებულებები",
        "{site} არის სოციალური ქსელი, სადაც მომხმარებლები ურთიერთობენ, აზიარებენ პოსტებს, აგზავნიან საჩუქრებს და თამაშობენ. რეგისტრაციით ან საიტის გამოყენებით თქვენ სრულად ეთანხმებით ამ წესებს. თუ არ ეთანხმებით, ნუ გამოიყენებთ საიტს."
      ],
      [
        "ასაკობრივი შეზღუდვა",
        "საიტი განკუთვნილია მხოლოდ 18 წელს მიღწეული პირებისთვის. რეგისტრაციისას უნდა მიუთითოთ დაბადების ნამდვილი თარიღი. 18 წლამდე პირის ანგარიში იშლება გაფრთხილების გარეშე."
      ],
      [
        "ანგარიში და უსაფრთხოება",
        "ერთ პირს შეუძლია ჰქონდეს მხოლოდ ერთი ანგარიში და მისი სხვისთვის გადაცემა დაუშვებელია. ვალდებული ხართ მიუთითოთ სწორი მონაცემები, საიდუმლოდ შეინახოთ პაროლი და დაუყოვნებლივ შეგვატყობინოთ უნებართვო წვდომის შესახებ. ანგარიშიდან შესრულებულ ყველა მოქმედებაზე პასუხისმგებელი ხართ თქვენ."
      ],
      [
        "ქცევის წესები",
        "პატივი ეცით სხვა მომხმარებლებს. აკრძალულია შეურაცხყოფა, მუქარა, დევნა, შანტაჟი, დისკრიმინაცია და სიძულვილის ენა. დაუშვებელია სხვის სახელით მოქმედება, ყალბი ანგარიშების შექმნა, სპამისა და უნებართვო რეკლამის გაგზავნა, საიტის მუშაობაში ჩარევა და მონაცემების ავტომატური შეგროვება."
      ],
      [
        "აკრძალული შინაარსი",
        "აკრძალულია პორნოგრაფიის, ძალადობის ან ტერორიზმის პროპაგანდის, ნარკოტიკების, იარაღისა და უკანონო სერვისების რეკლამის, არასრულწლოვნებისთვის საზიანო შინაარსის, თაღლითური მასალებისა და სხვისი პირადი მონაცემების უნებართვოდ გამოქვეყნება."
      ],
      [
        "უსაფრთხოება გაცნობისა და თამაშების დროს",
        "ჩვენ არ ვამოწმებთ იმ ადამიანების ვინაობას, რომლებსაც საიტზე გაიცნობთ. ნუ გაუზიარებთ უცნობებს პირად მონაცემებს, მისამართს და საბანკო რეკვიზიტებს, ნუ გაუგზავნით ფულს. შეხვედრები დანიშნეთ საჯარო ადგილას. საეჭვო ქცევის შესახებ შეგვატყობინეთ დაბლოკვისა და საჩივრის მეშვეობით."
      ],
      [
        "შინაარსი და საავტორო უფლებები",
        "თქვენ მიერ გამოქვეყნებულ შინაარსზე უფლებები თქვენ გრჩებათ. თქვენ გვაძლევთ უსასყიდლო, არაექსკლუზიურ ნებართვას, ვაჩვენოთ, შევინახოთ და ტექნიკურად დავამუშაოთ ის საიტზე. გამოაქვეყნეთ მხოლოდ ის, რაზეც უფლება ან ნებართვა გაქვთ. საიტის სახელი, ლოგო, დიზაინი და საჩუქრების ნახატები ჩვენ გვეკუთვნის."
      ],
      [
        "ქულები, საჩუქრები და გადახდები",
        "ქულები საიტის შიდა ერთეულია; ეს არ არის ფული და მისი განაღდება შეუძლებელია. ქულები გამოიყენება მხოლოდ საიტზე საჩუქრებისა და სხვა სერვისებისთვის. გადახდები ხორციელდება გადახდის პროვაიდერის მეშვეობით. შეძენილი ქულები და გაგზავნილი საჩუქრები არ ბრუნდება, გარდა კანონით გათვალისწინებული შემთხვევებისა. ფასები შეიძლება შეიცვალოს."
      ],
      [
        "საჩივრები და მოდერაცია",
        "შეგიძლიათ იჩივლოთ წესების დამრღვევ შინაარსზე ან მომხმარებელზე. საჩივრები განიხილება; საჭიროების შემთხვევაში შინაარსი იშლება და ანგარიში იზღუდება. თუ მოდერაციის გადაწყვეტილებას არ ეთანხმებით, მიმართეთ საიტის ადმინისტრაციას."
      ],
      [
        "პასუხისმგებლობის შეზღუდვა",
        "საიტი მოწოდებულია „როგორც არის“. ჩვენ არ ვიძლევით მისი უწყვეტი და უშეცდომო მუშაობის გარანტიას. ჩვენ არ ვაგებთ პასუხს მომხმარებელთა შინაარსზე და მათ ქცევაზე საიტზე ან მის გარეთ. ეს არ ეხება იმ უფლებებს, რომელთა შეზღუდვა კანონით დაუშვებელია."
      ],
      [
        "ანგარიშის შეჩერება და წაშლა",
        "წესების დამრღვევმა ანგარიშებმა შეიძლება მიიღონ გაფრთხილება, დროებითი ან მუდმივი ბლოკი. მძიმე დარღვევისას ანგარიში დაუყოვნებლივ იხურება და გამოუყენებელი ქულები არ ბრუნდება. ანგარიშის წაშლა ნებისმიერ დროს შეგიძლიათ პარამეტრებიდან."
      ],
      [
        "მოქმედი სამართალი და ცვლილებები",
        "ეს წესები რეგულირდება აზერბაიჯანის რესპუბლიკის კანონმდებლობით. წესები შეიძლება განახლდეს; მნიშვნელოვანი ცვლილებების შესახებ საიტზე გაცნობებთ. ცვლილებების შემდეგ საიტის გამოყენების გაგრძელება ახალი წესების მიღებას ნიშნავს."
      ]
    ],
    "privacy": [
      [
        "რა მონაცემებს ვაგროვებთ",
        "სარეგისტრაციო მონაცემები: სახელი, ელფოსტა, სქესი, დაბადების თარიღი, ქალაქი. პროფილის მონაცემები: ფოტო, სტატუსი და ის, რასაც თქვენ შესახებ წერთ. აქტივობა: პოსტები, კომენტარები, მოწონებები, მეგობრები, ჯგუფები, საჩუქრები და პროფილის ნახვები. ტექნიკური მონაცემები: IP მისამართი, მოწყობილობისა და ბრაუზერის ტიპი, შესვლის დრო."
      ],
      [
        "მონაცემთა გამოყენების მიზნები",
        "ანგარიშის შესაქმნელად და დასაცავად, სერვისების მისაწოდებლად, შესაფერისი შინაარსისა და მეგობრების რეკომენდაციების საჩვენებლად, შეტყობინებების გასაგზავნად, გადახდების დასამუშავებლად, თაღლითობისა და ბოროტად გამოყენების თავიდან ასაცილებლად, კანონის მოთხოვნების შესასრულებლად და საიტის გასაუმჯობესებლად."
      ],
      [
        "პროფილის ხილვადობა და კონფიდენციალურობის პარამეტრები",
        "თქვენი სახელი და პროფილის ფოტო ხილულია სხვა მომხმარებლებისთვის. პარამეტრებში ირჩევთ, ვინ ხედავს თქვენს პროფილს, მეგობრების სიას და საჩუქრებს და ვის შეუძლია მოგწეროთ. უხილავი რეჟიმი საშუალებას გაძლევთ დამალოთ ონლაინ სტატუსი და პროფილის ნახვები."
      ],
      [
        "შეტყობინებები",
        "პირად შეტყობინებებს ხედავენ მხოლოდ მიმოწერის მონაწილეები. შეტყობინებები ინახება ჩვენს სერვერებზე, რათა სერვისმა იმუშაოს. საჩივრის მიღებისას ან კანონის მოთხოვნით შეტყობინებები შეიძლება გადაიხედოს უსაფრთხოების მიზნით."
      ],
      [
        "გადახდის მონაცემები",
        "გადახდა ხორციელდება გადახდის პროვაიდერის გვერდზე. ჩვენ არ ვხედავთ და არ ვინახავთ თქვენი ბარათის ნომერს და სხვა მონაცემებს. ჩვენთან ინახება მხოლოდ ოპერაციის თანხა, თარიღი და შედეგი."
      ],
      [
        "მონაცემთა გადაცემა მესამე მხარეებისთვის",
        "ჩვენ არ ვყიდით პირად მონაცემებს. მათ გადავცემთ მხოლოდ იმ მხარეებს, რომლებიც სერვისის მიწოდებაში გვეხმარებიან (ჰოსტინგი, გადახდები, ელფოსტის გაგზავნა), და მხოლოდ აუცილებელი მოცულობით. კანონიერი მოთხოვნის შემთხვევაში მონაცემები შეიძლება გადაეცეს უფლებამოსილ ორგანოებს."
      ],
      [
        "შენახვის ვადა და უსაფრთხოება",
        "მონაცემები ინახება, სანამ თქვენი ანგარიში აქტიურია. ანგარიშის წაშლის შემდეგ ისინი იშლება გონივრულ ვადაში; კანონით მოთხოვნილი ჩანაწერები (მაგალითად, გადახდის) შეიძლება უფრო დიდხანს შეინახოს. პაროლები ღია სახით არ ინახება და კავშირი დაშიფრულია, თუმცა არცერთი სისტემა არ იძლევა სრული უსაფრთხოების გარანტიას."
      ],
      [
        "ქუქი-ფაილები და ბრაუზერის მეხსიერება",
        "საიტი იყენებს ქუქი-ფაილებსა და ბრაუზერის მეხსიერებას, რათა დაიმახსოვროს შესვლა, ენა, თემა და სხვა პარამეტრები. მათი წაშლა შეგიძლიათ ბრაუზერის პარამეტრებიდან, თუმცა ამ შემთხვევაში საიტის ზოგიერთმა ფუნქციამ შეიძლება არ იმუშაოს."
      ],
      [
        "არასრულწლოვნები",
        "საიტი არ არის განკუთვნილი 18 წლამდე პირებისთვის და ჩვენ შეგნებულად არ ვაგროვებთ მათ მონაცემებს. ასეთი ანგარიშის აღმოჩენისას ის იშლება მონაცემებთან ერთად."
      ],
      [
        "თქვენი უფლებები და კონტაქტი",
        "გაქვთ უფლება ნახოთ, შეასწოროთ და წაშალოთ თქვენი მონაცემები, გააპროტესტოთ მათი დამუშავება და დახუროთ ანგარიში. მოქმედებების უმეტესობა ხელმისაწვდომია პარამეტრებში; სხვა მოთხოვნებისთვის მიმართეთ საიტის ადმინისტრაციას. ეს პოლიტიკა შეიძლება განახლდეს; მნიშვნელოვანი ცვლილებების შესახებ საიტზე გაცნობებთ."
      ]
    ]
  }
};
