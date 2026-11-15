// Post-build step: rewrites every root-absolute URL in dist/ ("/_astro/x.js",
// url(/fonts/x.woff2)) into a path relative to the file it appears in.
// The site then works unchanged from any mount point: user.github.io/<repo>/
// today, a custom domain's root later, with no rebuild in between.
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = fileURLToPath(new URL('../dist', import.meta.url));

async function* walk(dir: string): AsyncGenerator<string> {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

let changed = 0;
for await (const file of walk(dist)) {
  if (!/\.(html|css)$/.test(file)) continue;
  const depth = relative(dist, file).split(sep).length - 1;
  const prefix = depth === 0 ? './' : '../'.repeat(depth);
  const source = await readFile(file, 'utf8');
  const output = source
    // href="/x", src="/x", poster="/x" (but not protocol-relative "//host")
    .replace(/\b(href|src|poster)=(["'])\/(?!\/)/g, `$1=$2${prefix}`)
    // url(/x), url('/x'), url("/x")
    .replace(/url\((["']?)\/(?!\/)/g, `url($1${prefix}`);
  if (output !== source) {
    await writeFile(file, output);
    changed += 1;
  }
}
console.log(`relativize: rewrote ${changed} file(s)`);
