import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import satori from 'satori';
import sharp from 'sharp';
import { EMBLEM_PATH, EMBLEM_VIEWBOX } from './emblem';

// Build-time only. Paths resolve from the project root because the bundled
// endpoint no longer sits next to the source files.
const fontDir = join(process.cwd(), 'src/assets/og');
const font = (file: string): Buffer => readFileSync(join(fontDir, file));

// The Latin Extended subset (ğ, ş, İ) is registered as its own family: satori
// only falls back per glyph across different family names, not within one.
const fonts = [
  { name: 'Sora', data: font('sora-latin-400.woff'), weight: 400 as const, style: 'normal' as const },
  { name: 'Sora Ext', data: font('sora-latin-ext-400.woff'), weight: 400 as const, style: 'normal' as const },
  { name: 'Sora', data: font('sora-latin-700.woff'), weight: 700 as const, style: 'normal' as const },
  { name: 'Sora Ext', data: font('sora-latin-ext-700.woff'), weight: 700 as const, style: 'normal' as const },
];

function emblemDataUri(color: string, opacity = 1): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${EMBLEM_VIEWBOX}"><path fill="${color}" fill-opacity="${opacity}" d="${EMBLEM_PATH}"/></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

type Node = { type: string; props: Record<string, unknown> };
const el = (type: string, style: Record<string, unknown>, children?: unknown, extra: Record<string, unknown> = {}): Node => ({
  type,
  props: { style, children, ...extra },
});

export interface OgCard {
  eyebrow: string;
  lineOne: string;
  lineTwo: string;
  caption: string;
  footer: string;
}

export async function renderOgImage(card: OgCard): Promise<Uint8Array> {
  // Two boxes on purpose: satori sizes with content-box, so padding on the
  // 100%-sized root would push the layout past the canvas. The inner box flexes.
  const frame = {
    width: '100%',
    height: '100%',
    display: 'flex',
    fontFamily: 'Sora, Sora Ext',
    color: '#f3f6ff',
    backgroundColor: '#030a24',
    backgroundImage:
      'radial-gradient(circle at 78% 8%, rgba(45,107,255,0.75), rgba(45,107,255,0) 55%), linear-gradient(140deg, #0c2a86 0%, #06133f 48%, #030a24 100%)',
  };
  const content = el(
    'div',
    {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '64px 72px',
      position: 'relative',
    },
    [
      el('img', { position: 'absolute', right: -90, bottom: -130, width: 620, height: 620 }, undefined, {
        src: emblemDataUri('#6ea8ff', 0.16),
        width: 620,
        height: 620,
      }),
      el('div', { display: 'flex', alignItems: 'center' }, [
        el('img', { width: 68, height: 68 }, undefined, { src: emblemDataUri('#FFC900'), width: 68, height: 68 }),
        el('div', { marginLeft: 20, fontSize: 30, fontWeight: 700, letterSpacing: 4 }, card.eyebrow),
      ]),
      el('div', { display: 'flex', flexDirection: 'column' }, [
        el('div', { fontSize: 92, fontWeight: 400, lineHeight: 1.04, letterSpacing: -3 }, card.lineOne),
        el('div', { fontSize: 92, fontWeight: 700, lineHeight: 1.04, letterSpacing: -3 }, card.lineTwo),
        el('div', { marginTop: 26, fontSize: 30, fontWeight: 700, color: '#FFC900', letterSpacing: 5 }, card.caption),
      ]),
      el('div', { display: 'flex', fontSize: 26, fontWeight: 400, color: '#9db0dc' }, card.footer),
    ],
  );
  const tree = el('div', frame, [content]);

  // satori's public type wants a ReactNode; a plain object tree is what it reads at runtime.
  const svg = await satori(tree as unknown as Parameters<typeof satori>[0], { width: 1200, height: 630, fonts });
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
  // JPEG keeps the preview small: the gradients make a ~280 KB PNG, and chat
  // apps drop link previews whose image is too heavy.
  return sharp(png).jpeg({ quality: 88, mozjpeg: true }).toBuffer();
}

export function renderEmblemIconPng(size: number): Uint8Array {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">` +
    `<rect width="100" height="100" fill="#06133f"/>` +
    `<path transform="translate(19 19) scale(0.62)" fill="#FFC900" d="${EMBLEM_PATH}"/></svg>`;
  return new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng();
}
