import type { APIRoute, GetStaticPaths } from 'astro';
import { people, store } from '../../data/team';
import { renderOgPng, type OgCard } from '../../lib/og';

// Turkish-aware uppercase: plain toUpperCase() would turn "i" into "I" instead of "İ".
const upper = (text: string): string => text.toLocaleUpperCase('tr-TR');
const footer = `${store.name} · ${store.district}, ${store.city}`;

export const getStaticPaths = (() => [
  {
    params: { slug: 'ekip' },
    props: {
      card: {
        eyebrow: 'TURKCELL',
        lineOne: store.mall,
        lineTwo: 'Ekibi',
        caption: 'DİJİTAL KARTVİZİTLER',
        footer,
      } satisfies OgCard,
    },
  },
  ...people.map((person) => ({
    params: { slug: person.slug },
    props: {
      card: {
        eyebrow: 'TURKCELL',
        lineOne: person.firstName,
        lineTwo: person.lastName,
        caption: upper(person.title),
        footer,
      } satisfies OgCard,
    },
  })),
]) satisfies GetStaticPaths;

export const GET: APIRoute<{ card: OgCard }> = async ({ props }) => {
  const png = await renderOgPng(props.card);
  return new Response(png as BodyInit, { headers: { 'Content-Type': 'image/png' } });
};
