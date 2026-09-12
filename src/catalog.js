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
  ...[1, 2, 3, 4].map((number) => ({
    id: `future-${number}`, title: `Future work ${String(number).padStart(2, '0')}`,
    category: 'Coming into view', kind: 'placeholder', ratio: number % 2 ? 4 / 3 : 4 / 5,
    description: 'An empty place in an evolving exhibition. This simple layout placeholder is not an artwork by Marnie.',
    medium: 'Layout placeholder · Not an artwork', note: 'A space for a future piece. No artwork, title or availability is implied.',
  })),
];

export function clampStop(index, count = works.length) {
  return Math.max(0, Math.min(count - 1, Math.round(Number(index) || 0)));
}

export function filterWorks(filter) {
  return works.filter((work) => filter === 'all' || work.kind === filter);
}

export function station(index) {
  return { x: index % 2 === 0 ? -1.6 : 1.6, y: 2.35, z: -index * 9 };
}
