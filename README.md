# Marnie — The Smoke Room

An evolving gallery for Marnie's original smoke-stained paper art, with a scroll-driven Three.js walkthrough, a studio-list form as the final stop, and an accessible HTML collection.

## Work locally

```sh
npm ci
npm run build
npm run dev
```

Open http://127.0.0.1:4178. The website is static; no backend, framework router or runtime CDN is required. `vendor/room.js` is committed so GitHub Pages can serve the same site without a build step. Rebuild it whenever `src/room.js` or `src/catalog.js` changes. Vercel runs the build script and publishes only `dist/`, keeping research and test files out of the public deployment.

## Add an artwork

Add the image to the repository and one record to `src/catalog.js`, following Lighthouse or Egret. Give it a unique ID, a title, category, real description and image display ratio. The ratio describes the image, not the artwork's physical measurements. The supplied `art/lighthouse.png` crop is already upright and uses `rotation: 0`. The original sideways `hero.jpg` remains available through the detail view, but is not used in the new mounts. Replace a placeholder record when a real work is ready, then run `npm run build`.

The single catalog populates the walkthrough, stop selector, collection filters and detail dialog. Placeholder records intentionally have no `src` and are labeled as non-artwork throughout. Preserve those labels until actual work is supplied. Update the static fallback cards in `index.html` if the initial real works change.

## Checks

```sh
npm test
npx playwright install chromium
npm run test:browser
```

The form posts through Formsubmit AJAX with a plain POST fallback and a confirmation-only thank-you state. Inquiries include the chosen artwork title. Browser tests do not submit email. Do not claim verified inbox delivery without a separate authorized live test.

## Project notes

- [Design research, preservation rules and verification](docs/gallery-design.md)
- [Collector outreach shortlist and 30-day plan](docs/collector-outreach.md)

The marketing plan is research and draft copy; no posts, applications or outreach were sent. The walkthrough currently has four real artwork stops and the final studio-list stop. No invented artworks are included.
