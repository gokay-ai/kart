// Absolute site URL, only known in CI (set from the GitHub Pages configuration).
// It is used for things that must be absolute: Open Graph tags and the vCard URL.
// Everything else on the site is relative, so a missing value is harmless.
export const SITE_URL: string = (process.env.SITE_URL ?? '').replace(/\/+$/, '');

export function absoluteUrl(path: string): string | undefined {
  if (!SITE_URL) return undefined;
  return `${SITE_URL}/${path.replace(/^\/+/, '')}`;
}

/** Relative prefix from a page to the site root: "/" -> "./", "/x/" -> "../". */
export function rootPrefix(pathname: string): string {
  const depth = pathname.split('/').filter(Boolean).length;
  return depth === 0 ? './' : '../'.repeat(depth);
}
