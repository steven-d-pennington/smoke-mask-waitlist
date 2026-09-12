import { build } from 'esbuild';
import { cp, mkdir, rm } from 'node:fs/promises';
await build({
  entryPoints: ['src/room.js'],
  outfile: 'vendor/room.js',
  bundle: true,
  minify: true,
  format: 'esm',
  target: ['es2022'],
  legalComments: 'linked',
});

// A dedicated deployment directory keeps research, tests and source tooling private.
await rm('dist', { recursive: true, force: true });
await mkdir('dist/src', { recursive: true });
for (const path of ['index.html', 'styles.css', 'gallery.js', 'waitlist.js', 'hero.jpg', 'egret.jpg', 'art', 'vendor']) {
  await cp(path, `dist/${path}`, { recursive: true });
}
await cp('src/catalog.js', 'dist/src/catalog.js');
