import { build } from 'esbuild';
await build({
  entryPoints: ['src/room.js'],
  outfile: 'vendor/room.js',
  bundle: true,
  minify: true,
  format: 'esm',
  target: ['es2022'],
  legalComments: 'linked',
});
