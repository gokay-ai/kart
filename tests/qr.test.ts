import { expect, test } from 'bun:test';
import { Resvg } from '@resvg/resvg-js';
import jsQR from 'jsqr';
import { people } from '../src/data/team';
import { qrSvg } from '../src/lib/qr';

// The styled QR (round dots, rounded finders, emblem badge over the centre)
// trades away error-correction budget, so prove a real decoder still reads it.
function decode(svg: string, width: number): string | undefined {
  const image = new Resvg(svg, { fitTo: { mode: 'width', value: width } }).render();
  return jsQR(new Uint8ClampedArray(image.pixels), image.width, image.height)?.data;
}

const bases = [
  'https://gokay-ai.github.io/kart/',
  'https://kart.example.com.tr/',
  'https://www.a-much-longer-custom-domain-name.com.tr/kartvizit/',
];

for (const base of bases) {
  for (const person of people) {
    const url = `${base}${person.slug}/`;
    test(`QR decodes back to ${url}`, () => {
      const svg = qrSvg(url);
      // 1200px: print / download size. 300px: smaller than the code ever appears on a phone.
      expect(decode(svg, 1200)).toBe(url);
      expect(decode(svg, 300)).toBe(url);
    });
  }
}

test('badge can be turned off', () => {
  const url = 'https://example.com/x/';
  expect(decode(qrSvg(url, { logo: false }), 600)).toBe(url);
});
