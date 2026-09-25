// Display ratios describe the photographs, never the physical artwork dimensions.
// Add a real work here to populate the room, collection and detail view together.
export const works = [
  { id: 'lighthouse', title: 'Lighthouse', category: 'Coastlines', kind: 'original',
    src: 'art/lighthouse.png', originalSrc: 'hero.jpg', ratio: 5 / 4, rotation: 0,
    alt: 'Smoke-stained paper artwork: a striped lighthouse above a coastal cliff, with soft clouds and a sailboat below.',
    description: 'A quiet coast, a distant sail, a lighthouse keeping watch. Crisp silhouettes emerge from the soft, unpredictable tones of smoke.',
    medium: 'Smoke-stained paper', note: 'Ask the studio about dimensions, framing and availability.' },
  { id: 'egret', title: 'Egret', category: 'Wildlife', kind: 'original',
    src: 'art/egret.png', originalSrc: 'egret.jpg', detailSrc: 'art/egret-detail.png', ratio: 5 / 6, rotation: 0,
    alt: 'Smoke-stained paper artwork: a white egret resting on a branch, surrounded by warm smoke-stained tones.',
    description: 'A moment of stillness, held in paper and smoke. The pale shape of an egret rests against a softly stained world.',
    medium: 'Smoke-stained paper', note: 'Ask the studio about dimensions, framing and availability.' },
  { id: 'floral-study', title: 'Floral Study', category: 'Botanical', kind: 'original',
    src: 'art/floral-study.jpg', ratio: 4 / 3, rotation: 0,
    alt: 'Colorful floral artwork with pink and yellow shapes, dark green stems and expressive flowers.',
    description: 'Pink, yellow and green fill a lively floral composition, with long stems and expressive petals layered over a patterned background.',
    medium: 'Artwork', note: 'Descriptive working title. Ask the studio for the official title, medium, dimensions, framing and availability.' },
  { id: 'woodland-mushrooms', title: 'Woodland Mushrooms', category: 'Woodland', kind: 'original',
    src: 'art/woodland-mushrooms.jpg', ratio: 3 / 4, rotation: 0,
    alt: 'Woodland artwork with tall green trees, a warm sunset sky and red mushrooms with white spots in the foreground.',
    description: 'A path into a green woodland beneath a glowing sky. Red mushrooms gather between the trees in the foreground.',
    medium: 'Artwork', note: 'Descriptive working title. Ask the studio for the official title, medium, dimensions, framing and availability.' },

];

export function clampStop(index, count = works.length) {
  return Math.max(0, Math.min(count - 1, Math.round(Number(index) || 0)));
}

export function filterWorks(filter) {
  return works.filter((work) => filter === 'all' || work.kind === filter);
}

export function station(index) {
  return { x: index % 2 === 0 ? -2.8 : 2.8, y: 2.35, z: -index * 9 };
}
