import type { APIRoute, GetStaticPaths } from 'astro';
import { people, type Person } from '../../data/team';
import { absoluteUrl } from '../../lib/site';
import { buildVCard } from '../../lib/vcard';

export const getStaticPaths = (() =>
  people.map((person) => ({ params: { slug: person.slug }, props: { person } }))) satisfies GetStaticPaths;

export const GET: APIRoute<{ person: Person }> = ({ props }) =>
  new Response(buildVCard(props.person, absoluteUrl(`${props.person.slug}/`)), {
    headers: { 'Content-Type': 'text/vcard; charset=utf-8' },
  });
