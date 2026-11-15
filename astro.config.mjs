import { defineConfig } from 'astro/config';

// No `site`/`base` here on purpose: the build is post-processed into fully
// relative URLs (scripts/relativize.ts) so the same output works under
// user.github.io/<repo>/ and under a custom domain without a rebuild.
export default defineConfig({
  trailingSlash: 'always',
  build: {
    format: 'directory',
    inlineStylesheets: 'always',
  },
  devToolbar: { enabled: false },
});
