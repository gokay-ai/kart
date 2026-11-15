// Single source of truth for everything shown on the cards.
// Fields marked TODO are still missing: the matching button stays visible but
// only shows a "coming soon" toast until a value is filled in here.

export interface Person {
  /** URL segment: <site>/<slug>/ */
  slug: string;
  firstName: string;
  lastName: string;
  title: string;
  tagline: string;
  /** E.164, e.g. +905321234567 */
  phone?: string;
  /** E.164; falls back to `phone` */
  whatsapp?: string;
  email?: string;
  /** Handle without @; falls back to the store account */
  instagram?: string;
  /** File name inside public/photos, e.g. "selami.jpg"; falls back to the monogram */
  photo?: string;
}

export interface Service {
  icon: 'repair' | 'sim' | 'account' | 'accessory';
  title: string;
  text: string;
}

export interface Store {
  brand: string;
  name: string;
  kind: string;
  mall: string;
  district: string;
  city: string;
  street: string;
  postalCode: string;
  /** Shared mobile / WhatsApp line (E.164); used for every person without their own `phone` */
  mobile?: string;
  /** Store landline (E.164) */
  landline?: string;
  /** Shared mailbox; used for every person without their own `email` */
  email?: string;
  /** Free text shown next to the clock icon */
  hours?: string;
  /** Search query handed to Google Maps for directions */
  mapsQuery: string;
  instagram?: string;
  services: Service[];
}

export const store: Store = {
  brand: 'Turkcell',
  name: 'Turkcell Palladium AVM',
  kind: 'Turkcell İletişim Merkezi',
  mall: 'Palladium AVM',
  district: 'Ataşehir',
  city: 'İstanbul',
  // TODO(verify): mall address from memory; add the floor / unit number.
  street: 'Barbaros Mah. Halk Cad. No:8/B',
  postalCode: '34746',
  // The team shares one mobile / WhatsApp number.
  mobile: '+905315972022',
  landline: '+902166631266',
  email: 'aykailetisim34@gmail.com',
  // TODO(verify): standard mall hours, confirm with the store.
  hours: 'Her gün 10:00 – 22:00',
  mapsQuery: 'Turkcell Palladium AVM Ataşehir İstanbul',
  instagram: 'turkcell_palladium',
  services: [
    {
      icon: 'repair',
      title: 'Telefon Onarımı',
      text: 'Batarya, ekran ve daha fazlası. Tüm marka ve modeller.',
    },
    {
      icon: 'sim',
      title: 'Hat Kampanyaları',
      text: 'Yeni hat, numara taşıma ve size uygun tarifeler.',
    },
    {
      icon: 'account',
      title: 'Turkcell İşlemleri',
      text: 'Fatura, paket, SIM değişimi ve tüm abonelik işlemleri.',
    },
    {
      icon: 'accessory',
      title: 'Aksesuar',
      text: 'Kılıf, şarj ürünleri, kulaklık ve akıllı aksesuarlar.',
    },
  ],
};

// TODO: title (and optionally photo) for each person. "Müşteri Danışmanı" is a
// placeholder title. Phone, WhatsApp, e-mail and Instagram come from the store
// unless a person sets their own.
export const people: Person[] = [
  {
    slug: 'selami-kacmaz',
    firstName: 'Selami',
    lastName: 'Kaçmaz',
    title: 'Müşteri Danışmanı',
    tagline: 'Turkcell’de aklınıza takılan her şey için bana ulaşın.',
  },
  {
    slug: 'erdal-aymelek',
    firstName: 'Erdal',
    lastName: 'Aymelek',
    title: 'Müşteri Danışmanı',
    tagline: 'Turkcell’de aklınıza takılan her şey için bana ulaşın.',
  },
  {
    slug: 'hazal-kilic',
    firstName: 'Hazal',
    lastName: 'Kılıç',
    title: 'Müşteri Danışmanı',
    tagline: 'Turkcell’de aklınıza takılan her şey için bana ulaşın.',
  },
];

export function fullName(p: Person): string {
  return `${p.firstName} ${p.lastName}`;
}

export function initials(p: Person): string {
  return `${p.firstName.charAt(0)}${p.lastName.charAt(0)}`.toLocaleUpperCase('tr-TR');
}

export function phoneOf(p: Person): string | undefined {
  return p.phone ?? store.mobile;
}

export function emailOf(p: Person): string | undefined {
  return p.email ?? store.email;
}

/** "+902166631266" -> "0216 663 12 66" (Turkish national layout; other shapes pass through). */
export function formatPhone(e164: string): string {
  const m = /^\+90(\d{3})(\d{3})(\d{2})(\d{2})$/.exec(e164);
  return m ? `0${m[1]} ${m[2]} ${m[3]} ${m[4]}` : e164;
}

export function storeAddress(): string {
  return `${store.street}, ${store.postalCode} ${store.district}/${store.city}`;
}
