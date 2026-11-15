import { fullName, store, type Person } from '../data/team';

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
  if (person.phone) lines.push(`TEL;TYPE=CELL,VOICE:${person.phone}`);
  if (person.email) lines.push(`EMAIL;TYPE=INTERNET,WORK:${person.email}`);
  lines.push(
    `ADR;TYPE=WORK:;;${esc(`${store.mall}, ${store.street}`)};${esc(store.district)};${esc(store.city)};${store.postalCode};Türkiye`,
  );
  if (url) lines.push(`URL:${url}`);
  lines.push('END:VCARD');
  // The spec requires CRLF line endings.
  return `${lines.join('\r\n')}\r\n`;
}
