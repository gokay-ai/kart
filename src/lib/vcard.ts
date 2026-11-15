import { emailOf, fullName, phoneOf, store, type Person } from '../data/team';

function esc(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1');
}

/** vCard 3.0: the version iOS and Android contacts both import without surprises. */
export function buildVCard(person: Person, url?: string): string {
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${esc(person.lastName)};${esc(person.firstName)};;;`,
    `FN:${esc(fullName(person))}`,
    `ORG:${esc(store.name)}`,
    `TITLE:${esc(person.title)}`,
  ];
  const mobile = phoneOf(person);
  if (mobile) lines.push(`TEL;TYPE=CELL,VOICE:${mobile}`);
  if (store.landline) lines.push(`TEL;TYPE=WORK,VOICE:${store.landline}`);
  const email = emailOf(person);
  if (email) lines.push(`EMAIL;TYPE=INTERNET,WORK:${email}`);
  lines.push(
    `ADR;TYPE=WORK:;;${esc(`${store.mall}, ${store.street}`)};${esc(store.district)};${esc(store.city)};${store.postalCode};Türkiye`,
  );
  if (url) lines.push(`URL:${url}`);
  lines.push('END:VCARD');
  // The spec requires CRLF line endings.
  return `${lines.join('\r\n')}\r\n`;
}
