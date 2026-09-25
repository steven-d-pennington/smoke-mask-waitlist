# The Smoke Room: design and verification

September 12, 2026. Starts from GitHub main `2d4f5cd`, including the user's production-sync PR. Production is not changed by this feature branch.

## Experience

A guided, user-controlled 3D gallery with six stops, plus an equivalent HTML collection. Lighthouse and Egret use the existing photographs without changing either source image. Four simple empty frames explicitly say they are layout placeholders, not Marnie's work. Room/frame dimensions are presentation units, not claims about physical size, framing included in a sale, or available inventory.

The catalog in `src/catalog.js` drives the room, collection, filters and detail views. More original works can be added without writing a new gallery scene. Next/previous buttons, direct stop selection, keyboard arrows/Home/End and horizontal swipes navigate the bounded exhibition. There is no autoplay or wheel hijacking. Details open in a native dialog, and an inquiry carries the selected title to the existing Formsubmit form. Form submission delivery has not been tested by sending mail.

## Research and implementation choices

- [Codrops, March 2026: scroll-reactive 3D galleries](https://tympanus.net/codrops/2026/03/09/building-a-scroll-reactive-3d-gallery-with-three-js-velocity-and-mood-based-backgrounds/): depth-spaced planes and bounded camera movement inspired the spatial approach. This implementation uses discrete visitor-controlled stops rather than binding ordinary page scroll to camera travel. Original implementation, not copied tutorial code.
- [Three.js responsive design](https://threejs.org/manual/en/responsive.html): ResizeObserver updates the camera aspect and canvas size. Device pixel ratio is capped at 1.6 to limit GPU cost on dense phone screens.
- [Three.js color management](https://threejs.org/manual/en/color-management.html): artwork textures and output use sRGB. Unlit image materials avoid recoloring the art under simulated lights.
- [W3C reduced-motion technique](https://www.w3.org/WAI/WCAG21/Techniques/css/C39.html): reduced-motion visitors start with the HTML collection. If they deliberately select the room, camera changes are immediate. Motion preference changes also return to the collection.

Installed pinned Three.js and esbuild from npm. No third-party agent instructions, random skill bundles, generated art, paid services or externally hosted runtime scripts were installed. `vendor/room.js` is the locally bundled, license-attributed scene. It is loaded on demand. Rendering stops when motion ends, the page is hidden, or the room is out of view. No permanent 60fps loop.

## Preservation and failure rules

- Existing photo bytes and the Formsubmit destination remain intact.
- Mockups have no image source, no availability/price and no artwork inquiry button.
- A late 3D load must not change a visitor's selected collection view.
- A load failure or lost graphics context leaves the collection usable, with a visible explanation.
- Detail close restores focus to its opener; choosing inquiry instead restores focus to email. The close event must not override that focus destination.
- No JavaScript still provides both real photographs and the existing signup form.
- Content and form do not claim a print edition, price, stock level or physical dimensions.

## Checks

Run `npm test` and `npm run test:browser` after `npm run build`. Browser coverage includes bounds/keyboard navigation, real vs placeholder detail, inquiry context/clear, mobile overflow, reduced motion, failed scene load, late-load mode switching and no-JavaScript fallback. No tests send the form.

Desktop and 390px mobile viewport screenshots were inspected. These are desktop-browser simulations, not a physical iPhone/Android performance certification. The existing photos, especially the egret, limit close-up sharpness. Better straight-on, high-resolution photography would improve the gallery more than simulated detail.

## Supplied handoff and user decision

The user supplied `Waitlist form and design system updates.zip` during implementation. Its design references are source material, not code executed or shipped. Its static seven-section layout conflicts with the earlier walkthrough request; the user explicitly chose **keep the walkthrough as the main experience**. Accordingly, this version preserves the spatial primary experience and adopts the documented tokens, Instrument Sans / Cormorant typography, square warm/sage mounts, prepared photo crops, exclusive clearable interest chips and asynchronous waitlist states. It does not claim a pixel-identical seven-section static page.

The four `art/*.png` files are copied unchanged from the supplied handoff. Original `hero.jpg` and `egret.jpg` remain untouched. The prepared lighthouse crop is already upright; the old CSS/3D rotation is no longer applied to it. The egret detail is labeled as a detail of the same work, never counted as another original. Collection windows keep a 5:6 ratio; the landscape is contained to avoid cutting off the lighthouse. No artwork or imitation was generated.

The form uses the documented Formsubmit AJAX endpoint with the original POST action as no-JavaScript fallback. Controls lock during a request, interest is exclusive/clearable, only an explicit successful service response reveals the thank-you state, and failure preserves all values. Mocked browser coverage verifies success, unsuccessful/activation responses, duplicate-send prevention, preserved values and retry. No live message was sent; inbox receipt remains unverified.

The local ZIP is ignored by Git. No design-component `support.js` runtime is shipped. Prepared PNG assets are retained without another conversion to avoid unnecessary photographic changes; future replacements should use optimized images and the same documented mount ratios.

## September 24 production revision: scrollable room and final form

The approved Scrollcraft follow-up retains the native 3D room and binds ordinary page scroll to a continuous central-aisle camera route. Four real artwork stops lead to a fifth studio-list reception stop. Visible artwork can be clicked directly; selector, arrows and keyboard navigation remain available. The same form node moves between room and collection views, preserving typed values and request state. `/#studio-list` and `/#collection` are supported entry links. The earlier alternative concept pages are not part of production.

Release checks: `npm run build`; three catalog checks; nine Playwright checks covering scroll-to-form, direct raycast artwork click, detail crop/inquiry context, same-position modal close, draft retention across views, compact layout, reduced-motion/renderer-failure fallback, no-JavaScript POST, exclusive interests and mocked form failure/retry/confirmation. No email was sent and actual inbox delivery remains unverified. Physical-device testing remains distinct from the verified desktop/mobile viewport simulations.
