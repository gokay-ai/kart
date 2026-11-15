# Turkcell Palladium AVM digital business cards

Animated, mobile-first digital business cards for the store team. Each person
has a page that a customer opens by scanning a QR code: a 3D card that tilts and
flips, one-tap "save to contacts" (vCard), call / WhatsApp / e-mail / Instagram
buttons, the store's services and location, and a share sheet with the QR.

| Page | Path |
| --- | --- |
| Team index | `/` |
| Selami Kaçmaz | `/selami-kacmaz/` |
| Erdal Aymelek | `/erdal-aymelek/` |
| Hazal Kılıç | `/hazal-kilic/` |
| Printable QR codes (PNG / SVG download) | `/qr/` |

## Editing content

Everything shown on the cards lives in [`src/data/team.ts`](src/data/team.ts):
people (title, phone, e-mail, Instagram, photo) and the store (address, hours,
services). Fields marked `TODO` are still missing; until they are filled in, the
matching button stays visible and shows a "coming soon" toast.

- Phone numbers are E.164: `+905321234567`.
- Photos go in `public/photos/` (square, at least 400x400) and are referenced by
  file name: `photo: 'selami.jpg'`. Without one the card shows the monogram.
- Adding a person is one more entry in `people`; the page, vCard, QR and share
  image are generated from it.

## Commands

```sh
bun install
bun run dev      # http://localhost:4321
bun run build    # static site in dist/
bun run check    # type-check
bun test         # decodes the generated QR codes with a real decoder
```

## How it is built

- [Astro](https://astro.build) static site, TypeScript, no UI framework. Animations
  are CSS plus a few small vanilla modules in `src/scripts/`.
- **Location independent.** `scripts/relativize.ts` rewrites the build to relative
  URLs, so the same output works at `user.github.io/<repo>/` and at the root of a
  custom domain with no rebuild.
- **QR codes are generated in the browser** from the address the page is served
  at (`src/lib/qr.ts`), so they always point at the current domain.
- vCards (`/vcf/<slug>.vcf`) and share images (`/og/<slug>.jpg`) are generated at
  build time.
- Pages are `noindex`: cards are handed out by QR or link and people's contact
  details should not end up in search results.

## Deploy

Pushing to `main` builds and deploys to GitHub Pages
(`.github/workflows/deploy.yml`).

### Custom domain

1. Add the domain under repository Settings → Pages → Custom domain and create
   the DNS record GitHub asks for.
2. Re-run the deploy workflow once (`gh workflow run deploy.yml`) so share
   previews and vCards carry the new address. The pages themselves work
   immediately, before the re-run.
3. Open `/qr/` **on the new domain** and download the codes for print from
   there. Print only codes generated on the final domain.
