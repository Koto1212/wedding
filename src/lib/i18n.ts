import { wedding } from "./wedding";

// Everything guests read, in English and Arabic. English event details come
// from wedding.ts; the Arabic ones are written out here.

export type Locale = "en" | "ar";

export function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "ar";
}

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
export function arabicDigits(value: string | number): string {
  return String(value).replace(/\d/g, (d) => AR_DIGITS[Number(d)]);
}

function enAdmits(n: number): string {
  return n === 1 ? "Admits 1 guest" : `Admits ${n} guests`;
}

function arAdmits(n: number): string {
  if (n === 1) return "لشخص واحد";
  if (n === 2) return "لشخصين";
  if (n <= 10) return `لـ${arabicDigits(n)} أشخاص`;
  return `لـ${arabicDigits(n)} شخصاً`;
}

const en = {
  locale: "en" as Locale,
  dir: "ltr" as "ltr" | "rtl",
  couple: {
    one: wedding.partnerOne,
    two: wedding.partnerTwo,
    and: "and",
    joined: `${wedding.partnerOne} & ${wedding.partnerTwo}`,
    monogram: wedding.monogram,
    seal: wedding.monogram.replace(/\s/g, ""),
  },
  date: {
    display: wedding.dateDisplay,
    weekday: wedding.invitation.weekday,
    day: String(new Date(`${wedding.dateISO}T12:00:00`).getDate()),
    month: new Date(`${wedding.dateISO}T12:00:00`).toLocaleString("en-US", { month: "long" }),
    yearWords: wedding.invitation.yearWords,
    time: wedding.timeDisplay,
    timeWords: wedding.invitation.timeWords,
    rsvpDeadline: wedding.rsvpDeadline,
  },
  meta: {
    title: `${wedding.partnerOne} & ${wedding.partnerTwo} — Wedding Invitation`,
    description: `You're invited to celebrate ${wedding.partnerOne} and ${wedding.partnerTwo} on ${wedding.dateDisplay}.`,
  },
  envelope: {
    invited: "You are cordially invited",
    tap: "Tap the seal to open",
    openLabel: "Open the invitation",
  },
  nav: {
    story: "Story",
    attire: "Attire",
    venue: "Venue",
    rsvp: "RSVP",
    switchLabel: "عربي",
    switchHref: "/ar",
  },
  invite: {
    opening: wedding.invitation.opening,
    request: wedding.invitation.request,
    cardLine: wedding.adultsOnly.cardLine,
    reply: "Kindly reply",
    details: "The details",
    scrollLabel: "Scroll to our story",
  },
  story: {
    eyebrow: "Chapter one",
    headline: wedding.story.headline,
    body: wedding.story.body,
  },
  attire: {
    eyebrow: "Dress code",
    title: "Attire",
    dressCode: wedding.dressCode,
    adultsTitle: wedding.adultsOnly.title,
    adultsNote: wedding.adultsOnly.note,
  },
  venue: {
    eyebrow: "Where",
    title: "The venue",
    name: wedding.venue.name,
    address: wedding.venue.address,
    city: wedding.city,
    note: wedding.venue.note,
    directions: "Get directions",
    viewLocation: "View location",
  },
  rsvp: {
    eyebrow: `Please respond by ${wedding.rsvpDeadline}`,
    title: "Kindly reply",
    name: "Name",
    attend: "Will you attend?",
    accept: "Joyfully accepts",
    decline: "Regretfully declines",
    sendBy: "Send my entry pass by",
    email: "Email",
    whatsapp: "WhatsApp",
    emailPlaceholder: "you@example.com",
    phonePlaceholder: "079 123 4567",
    note: "A note for the couple",
    notePlaceholder: "Song requests, dietary notes, well wishes…",
    submit: "Send reply",
    sending: "Sending…",
    thanks: "Thank you",
    received:
      "Your reply has been received. We cannot wait to see you — or to miss you kindly if you cannot make it.",
    emailSent: "Your personal entry pass is on its way to your inbox — please bring it on the day.",
    whatsappSoon: "We'll send your personal entry pass to your WhatsApp — you can also open it below.",
    viewPass: "View my entry pass",
    another: "Reply for another guest",
    genericError: "Something went wrong.",
    errors: {
      name: "Please enter your full name.",
      contact: "Please enter your email or WhatsApp number.",
      email: "Please enter a valid email.",
      phone: "Please check your WhatsApp number (e.g. 079 123 4567).",
      status: "Please choose an attendance option.",
      server: "Unable to save your RSVP right now.",
    },
  },
  pass: {
    eyebrow: "Entry pass",
    admits: enAdmits,
    checkedIn: "Checked in",
    showAtDoor: "Please show this at the door. It works once — kindly don't share it.",
    cardFooter: "Please show this at the door · Works once",
    saveImage: "Save image",
    inactiveTitle: "Pass not active",
    inactiveBody: `This pass isn't valid. If you think that's a mistake, please contact ${wedding.partnerOne} & ${wedding.partnerTwo}.`,
    qrLabel: "Your entry QR code",
    title: `Your entry pass — ${wedding.partnerOne} & ${wedding.partnerTwo}`,
    description: `${wedding.dateDisplay} · ${wedding.venue.name}, ${wedding.city}. Please show this pass at the door.`,
    imageAlt: "Entry pass with QR code",
  },
  adultsHint: wedding.adultsOnly.rsvpHint,
  email: {
    subject: `Your entry pass — ${wedding.partnerOne} & ${wedding.partnerTwo}, ${wedding.dateDisplay}`,
    greeting: (name: string) => `Dear ${name},`,
    intro:
      "thank you for your reply — we are so happy you will be celebrating with us. Please bring this pass to the door; it will be scanned when you arrive.",
    personal: "This code is personal and works once — please don't share it.",
    qrAlt: "Your entry QR code",
    text: (name: string) =>
      `Dear ${name},\n\nThank you for your reply! Your personal entry QR code is attached — please bring it to the door on ${wedding.dateDisplay}. It works once, so please don't share it.\n\n${wedding.venue.name}, ${wedding.city}\nLocation: ${wedding.venue.mapUrl}\n\n${wedding.partnerOne} & ${wedding.partnerTwo}`,
  },
  whatsapp: (name: string, passLink: string) =>
    [
      `Dear ${name},`,
      "",
      `We're so happy you'll be celebrating with us! Here is your personal entry pass for ${wedding.partnerOne} & ${wedding.partnerTwo}'s wedding — please show the QR code at the door:`,
      passLink,
      "",
      `Date: ${wedding.invitation.weekday}, ${wedding.dateDisplay} · ${wedding.timeDisplay}`,
      `Location: ${wedding.venue.name}, ${wedding.venue.address}`,
      wedding.venue.mapUrl,
      "",
      wedding.adultsOnly.rsvpHint,
    ].join("\n"),
  footer: "With love — we cannot wait to celebrate with you.",
};

// wedding.ts is `as const`, so its strings are literal types; widen them to
// plain strings so the Arabic text fits the same shape.
type Widen<T> = T extends string
  ? string
  : T extends (...args: infer A) => infer R
    ? (...args: A) => Widen<R>
    : T extends object
      ? { [K in keyof T]: Widen<T[K]> }
      : T;

export type Content = Omit<Widen<typeof en>, "locale" | "dir"> & {
  locale: Locale;
  dir: "ltr" | "rtl";
};

const AR_ONE = "محمد";
const AR_TWO = "عرين";
const AR_COUPLE = `${AR_ONE} و ${AR_TWO}`;
const AR_DATE = "الأحد ١٣ كانون الأول ٢٠٢٦";
const AR_TIME = "الساعة الرابعة عصراً";
const AR_VENUE = "فندق ستراند";
const AR_ADDRESS = "شارع الأميرة تغريد محمد، الصويفية، عمّان";
const AR_CITY = "عمّان، الأردن";
const AR_ADULTS_HINT = "حفلنا مخصّص للكبار — شكراً لتفهّمكم.";

const ar: Content = {
  locale: "ar",
  dir: "rtl",
  couple: {
    one: AR_ONE,
    two: AR_TWO,
    and: "و",
    joined: AR_COUPLE,
    // "و" (and) instead of "&", which sits awkwardly between Arabic letters
    monogram: "م و ع",
    seal: "م و ع",
  },
  date: {
    display: AR_DATE,
    weekday: "الأحد",
    day: "١٣",
    month: "كانون الأول",
    yearWords: "عام ألفين وستة وعشرين",
    time: AR_TIME,
    timeWords: "في تمام الساعة الرابعة عصراً",
    rsvpDeadline: "١ آب ٢٠٢٦",
  },
  meta: {
    title: `${AR_COUPLE} — دعوة زفاف`,
    description: `يسعدنا دعوتكم لمشاركتنا فرحة زفاف ${AR_COUPLE} يوم ${AR_DATE}.`,
  },
  envelope: {
    invited: "أنتم مدعوون بكل محبة",
    tap: "اضغطوا على الختم لفتح الدعوة",
    openLabel: "افتح الدعوة",
  },
  nav: {
    story: "حكايتنا",
    attire: "اللباس",
    venue: "المكان",
    rsvp: "تأكيد الحضور",
    switchLabel: "English",
    switchHref: "/",
  },
  invite: {
    opening: "بكل الحب، ومع عائلتيهما",
    request: "يتشرّفان بدعوتكم لمشاركتهما\nفرحة حفل زفافهما",
    cardLine: "نرجو التكرّم بأن يكون الحفل للكبار فقط",
    reply: "تأكيد الحضور",
    details: "التفاصيل",
    scrollLabel: "انتقل إلى حكايتنا",
  },
  story: {
    eyebrow: "الفصل الأول",
    headline: "حكايتنا",
    body: "ما بدأ بحديثٍ هادئ على فنجان قهوة، أصبح حياةً لم نطق صبراً لنتشاركها. عبر مواسم من السفر والضحك وكل ما بينهما، وجد كلٌّ منّا في الآخر بيتاً — واليوم ندعوكم لتحتفلوا معنا ببداية فصلنا الجديد.",
  },
  attire: {
    eyebrow: "قواعد اللباس",
    title: "اللباس",
    dressCode: "لباس رسمي",
    adultsTitle: "أمسية للكبار",
    adultsNote:
      "نحبّ أطفالكم كثيراً، لكنّ حفلنا سيكون مخصّصاً للكبار فقط. نتمنّى أن تكون فرصةً لتستمتعوا معنا بأمسيةٍ مليئة بالفرح والرقص.",
  },
  venue: {
    eyebrow: "أين",
    title: "مكان الحفل",
    name: AR_VENUE,
    address: AR_ADDRESS,
    city: AR_CITY,
    note: "نتطلّع للاحتفال معكم.",
    directions: "الاتجاهات",
    viewLocation: "عرض الموقع",
  },
  rsvp: {
    eyebrow: "يُرجى الرد قبل ١ آب ٢٠٢٦",
    title: "تأكيد الحضور",
    name: "الاسم",
    attend: "هل ستحضرون؟",
    accept: "يسعدني الحضور",
    decline: "أعتذر عن الحضور",
    sendBy: "أرسلوا بطاقة الدخول عبر",
    email: "البريد الإلكتروني",
    whatsapp: "واتساب",
    emailPlaceholder: "you@example.com",
    phonePlaceholder: "079 123 4567",
    note: "رسالة للعروسين",
    notePlaceholder: "طلب أغنية، ملاحظات، أمنيات…",
    submit: "إرسال الرد",
    sending: "جارٍ الإرسال…",
    thanks: "شكراً لكم",
    received:
      "وصلنا ردّكم. لا نطيق صبراً لرؤيتكم — وسنفتقدكم بكل محبة إن لم تتمكّنوا من الحضور.",
    emailSent: "بطاقة دخولكم في طريقها إلى بريدكم الإلكتروني — يُرجى إحضارها يوم الحفل.",
    whatsappSoon: "سنرسل بطاقة دخولكم إلى واتساب — ويمكنكم فتحها من هنا أيضاً.",
    viewPass: "عرض بطاقة الدخول",
    another: "الرد لضيف آخر",
    genericError: "حدث خطأ ما.",
    errors: {
      name: "يُرجى إدخال الاسم الكامل.",
      contact: "يُرجى إدخال البريد الإلكتروني أو رقم الواتساب.",
      email: "يُرجى إدخال بريد إلكتروني صحيح.",
      phone: "يُرجى التحقق من رقم الواتساب (مثلاً 079 123 4567).",
      status: "يُرجى اختيار الحضور أو الاعتذار.",
      server: "تعذّر حفظ ردّكم الآن، يُرجى المحاولة لاحقاً.",
    },
  },
  pass: {
    eyebrow: "بطاقة دخول",
    admits: arAdmits,
    checkedIn: "تم الدخول",
    showAtDoor: "يُرجى إبراز هذه البطاقة عند الدخول. صالحة لمرة واحدة — نرجو عدم مشاركتها.",
    cardFooter: "يُرجى إبرازها عند الدخول · صالحة لمرة واحدة",
    saveImage: "حفظ الصورة",
    inactiveTitle: "البطاقة غير فعّالة",
    inactiveBody: `هذه البطاقة غير صالحة. إن كان هناك خطأ، يُرجى التواصل مع ${AR_COUPLE}.`,
    qrLabel: "رمز الدخول الخاص بكم",
    title: `بطاقة دخولكم — ${AR_COUPLE}`,
    description: `${AR_DATE} · ${AR_VENUE}، ${AR_CITY}. يُرجى إبراز البطاقة عند الدخول.`,
    imageAlt: "بطاقة دخول مع رمز QR",
  },
  adultsHint: AR_ADULTS_HINT,
  email: {
    subject: `بطاقة دخولكم — ${AR_COUPLE}، ${AR_DATE}`,
    greeting: (name: string) => `أهلاً ${name}،`,
    intro:
      "شكراً لردّكم — يسعدنا جداً أنكم ستشاركوننا فرحتنا. يُرجى إحضار هذه البطاقة معكم، وسيتم مسحها عند وصولكم.",
    personal: "هذا الرمز شخصي وصالح لمرة واحدة — نرجو عدم مشاركته.",
    qrAlt: "رمز الدخول الخاص بكم",
    text: (name: string) =>
      `أهلاً ${name}،\n\nشكراً لردّكم! رمز الدخول الخاص بكم مرفق — يُرجى إحضاره معكم يوم ${AR_DATE}. الرمز صالح لمرة واحدة، نرجو عدم مشاركته.\n\n${AR_VENUE}، ${AR_CITY}\nالموقع: ${wedding.venue.mapUrl}\n\n${AR_COUPLE}`,
  },
  whatsapp: (name: string, passLink: string) =>
    [
      `أهلاً ${name}،`,
      "",
      `يسعدنا جداً أنكم ستشاركوننا فرحتنا! هذه بطاقة الدخول الخاصة بكم لحفل زفاف ${AR_COUPLE} — يُرجى إبراز رمز QR عند الدخول:`,
      passLink,
      "",
      `الموعد: ${AR_DATE} · ${AR_TIME}`,
      `المكان: ${AR_VENUE}، ${AR_ADDRESS}`,
      wedding.venue.mapUrl,
      "",
      AR_ADULTS_HINT,
    ].join("\n"),
  footer: "مع كل الحب — لا نطيق صبراً للاحتفال معكم.",
};

export function content(locale: Locale = "en"): Content {
  return locale === "ar" ? ar : en;
}
