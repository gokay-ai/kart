import { encode } from 'uqr';
import { EMBLEM_PATH } from './emblem';

export interface QrStyle {
  dark?: string;
  light?: string;
  accent?: string;
  /** Quiet zone in modules. The spec asks for 4; 3 scans fine on a light panel. */
  quiet?: number;
  /** Emblem badge in the middle. Costs error-correction budget, so `ecc` stays at H. */
  logo?: boolean;
}

const FINDER = 7;
// uqr's QrCodeDataType.Alignment (a const enum value, inlined to keep the browser bundle small).
const ALIGNMENT = 4;

/**
 * Renders a QR code as a standalone SVG string: round data dots, rounded finder
 * patterns and the emblem in the centre. Works at build time and in the browser.
 */
export function qrSvg(text: string, style: QrStyle = {}): string {
  const { dark = '#081640', light = '#ffffff', accent = '#FFC900', quiet = 3, logo = true } = style;
  const { data, types, size } = encode(text, { ecc: 'H', border: 0 });
  const total = size + quiet * 2;

  // Alignment patterns must stay solid shapes. Drawn as loose dots, decoders
  // that search for them lock onto ordinary data dots and misread the grid.
  const isAlignment = (x: number, y: number): boolean => types[y]?.[x] === ALIGNMENT;

  const inFinder = (x: number, y: number): boolean =>
    (x < FINDER && y < FINDER) ||
    (x >= size - FINDER && y < FINDER) ||
    (x < FINDER && y >= size - FINDER);

  // Odd-sized square so it stays centred on the module grid; ~24% of the width
  // covers under 6% of the modules, well inside what level H can recover.
  let badge = logo ? Math.round(size * 0.24) : 0;
  if (badge % 2 === 0 && badge > 0) badge += 1;
  const badgeStart = (size - badge) / 2;
  const inBadge = (x: number, y: number): boolean =>
    badge > 0 && x >= badgeStart && x < badgeStart + badge && y >= badgeStart && y < badgeStart + badge;

  const r = 0.46;
  let dots = '';
  let alignment = '';
  for (let y = 0; y < size; y++) {
    const row = data[y];
    if (!row) continue;
    for (let x = 0; x < size; x++) {
      if (isAlignment(x, y)) {
        // Top-left corner of a 5x5 alignment pattern: draw it once, as a small finder.
        if (!isAlignment(x - 1, y) && !isAlignment(x, y - 1) && !inBadge(x + 2, y + 2)) {
          const ox = x + quiet;
          const oy = y + quiet;
          alignment +=
            `<rect x="${ox}" y="${oy}" width="5" height="5" rx="1.5" fill="${dark}"/>` +
            `<rect x="${ox + 1}" y="${oy + 1}" width="3" height="3" rx="0.8" fill="${light}"/>` +
            `<rect x="${ox + 2}" y="${oy + 2}" width="1" height="1" rx="0.35" fill="${dark}"/>`;
        }
        continue;
      }
      if (!row[x] || inFinder(x, y) || inBadge(x, y)) continue;
      const cx = x + quiet + 0.5;
      const cy = y + quiet + 0.5;
      dots += `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0`;
    }
  }

  const finder = (x: number, y: number): string => {
    const ox = x + quiet;
    const oy = y + quiet;
    return (
      `<rect x="${ox}" y="${oy}" width="7" height="7" rx="2.1" fill="${dark}"/>` +
      `<rect x="${ox + 1}" y="${oy + 1}" width="5" height="5" rx="1.35" fill="${light}"/>` +
      `<rect x="${ox + 2}" y="${oy + 2}" width="3" height="3" rx="0.95" fill="${dark}"/>`
    );
  };

  let badgeSvg = '';
  if (badge > 0) {
    const inset = 0.35;
    const side = badge - inset * 2;
    const origin = badgeStart + quiet + inset;
    const pad = side * 0.17;
    const scale = (side - pad * 2) / 100;
    badgeSvg =
      `<rect x="${origin}" y="${origin}" width="${side}" height="${side}" rx="${side * 0.28}" fill="${dark}"/>` +
      `<path transform="translate(${origin + pad} ${origin + pad}) scale(${scale})" fill="${accent}" d="${EMBLEM_PATH}"/>`;
  }

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" role="img" aria-label="QR kod">` +
    `<rect width="${total}" height="${total}" fill="${light}"/>` +
    `<path d="${dots}" fill="${dark}"/>` +
    finder(0, 0) +
    finder(size - FINDER, 0) +
    finder(0, size - FINDER) +
    alignment +
    badgeSvg +
    `</svg>`
  );
}
