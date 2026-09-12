import { works, clampStop, filterWorks } from './src/catalog.js';

const $ = selector => document.querySelector(selector);
const roomHost = $('#room-canvas');
const shell = $('#gallery-stage');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let active = 0;
let mode = reduced.matches ? 'collection' : 'walkthrough';
let engine;
let loading;
let failed = false;
let filter = 'all';
let focusReturn;

function artMarkup(work) {
  if (!work.src) return `<div class="placeholder-art" style="aspect-ratio:${work.ratio}"><span aria-hidden="true">+</span><p>Future work</p><small>Layout placeholder · Not an artwork</small></div>`;
  return `<div class="photo ${work.rotation ? 'photo-rotated' : ''}" style="aspect-ratio:${work.ratio}"><img src="${work.src}" alt="${work.alt}" loading="lazy" /></div>`;
}

function renderCollection() {
  $('#collection-grid').innerHTML = filterWorks(filter).map(work => `<article class="collection-card ${work.kind}"><button class="art-button" data-work="${work.id}" aria-label="${work.kind === 'original' ? 'View' : 'Preview placeholder for'} ${work.title}"><div class="collection-mount">${artMarkup(work)}</div><span class="view-label">${work.kind === 'original' ? 'Look closer ↗' : 'Empty exhibition space'}</span></button><div class="card-caption"><h3>${work.title}</h3><span>${work.kind === 'original' ? work.category : 'Placeholder'}</span></div><p>${work.medium}${work.kind === 'original' ? ' · Original' : ''}</p></article>`).join('');
}

function goTo(index) {
  active = clampStop(index);
  const work = works[active];
  $('#stop-title').textContent = work.title;
  $('#stop-medium').textContent = work.medium;
  $('#stop-counter').textContent = `${String(active + 1).padStart(2, '0')} / ${String(works.length).padStart(2, '0')}`;
  $('#stop-type').textContent = work.kind === 'original' ? 'Original work' : 'Layout placeholder · Not an artwork';
  $('#view-work').textContent = work.kind === 'original' ? 'Look closer ↗' : 'About this space ↗';
  $('#previous-work').disabled = active === 0;
  $('#next-work').disabled = active === works.length - 1;
  $('#stop-select').value = String(active);
  document.querySelectorAll('[data-stop]').forEach(button => {
    button.setAttribute('aria-current', Number(button.dataset.stop) === active ? 'step' : 'false');
  });
  engine?.goTo(active);
}

function failRoom() {
  failed = true;
  engine?.dispose(); engine = undefined;
  shell.dataset.state = 'fallback';
  $('#gallery-notice').hidden = false;
  $('#gallery-notice').textContent = 'The 3D room couldn’t open on this device. You can explore every work in the collection below.';
  setMode('collection');
}

async function loadRoom() {
  if (engine || loading || failed) return;
  shell.dataset.state = 'loading';
  $('#gallery-message').textContent = 'Opening the gallery…';
  loading = import('./vendor/room.js').then(module => module.createRoom(roomHost, active, failRoom));
  try {
    const ready = await loading;
    if (failed) { ready.dispose(); return; }
    engine = ready;
    engine.goTo(active, true);
    engine.setEnabled(mode === 'walkthrough' && !document.hidden);
    shell.dataset.state = 'ready';
    $('#gallery-message').textContent = 'Use the arrows or swipe sideways to explore. Take your time.';
  } catch { failRoom(); }
  finally { loading = undefined; }
}

function setMode(nextMode) {
  mode = nextMode;
  const walking = mode === 'walkthrough' && !failed;
  shell.hidden = !walking;
  $('#gallery-controls').hidden = !walking;
  $('#collection').classList.toggle('collection-featured', !walking);
  document.querySelectorAll('[data-mode]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.mode === mode)));
  engine?.setEnabled(walking && !document.hidden);
  if (walking) loadRoom();
}

const dialog = $('#art-dialog');
function showWork(id, opener) {
  const work = works.find(item => item.id === id);
  if (!work) return;
  focusReturn = opener;
  $('#detail-art').innerHTML = artMarkup(work);
  $('#detail-title').textContent = work.title;
  $('#detail-type').textContent = work.kind === 'original' ? `${work.category} / Original` : 'Layout placeholder · Not an artwork';
  $('#detail-description').textContent = work.description;
  $('#detail-medium').textContent = work.medium;
  $('#detail-note').textContent = work.note;
  $('#detail-inquire').hidden = work.kind !== 'original';
  $('#detail-inquire').dataset.work = work.id;
  $('#original-photo').hidden = !work.src;
  if (work.src) $('#original-photo').href = work.originalSrc || work.src;
  const cropToggle = $('#detail-crop-toggle');
  cropToggle.hidden = !work.detailSrc;
  cropToggle.setAttribute('aria-pressed', 'false');
  cropToggle.textContent = 'View the detail crop';
  cropToggle.onclick = () => {
    const showDetail = cropToggle.getAttribute('aria-pressed') !== 'true';
    cropToggle.setAttribute('aria-pressed', String(showDetail));
    cropToggle.textContent = showDetail ? 'View the full piece' : 'View the detail crop';
    $('#detail-art').innerHTML = artMarkup(showDetail ? { ...work, src: work.detailSrc, ratio: 5 / 4, alt: 'Smoke-stained paper artwork: detail of the egret and warm-toned branches.' } : work);
  };
  dialog.showModal();
  document.body.classList.add('dialog-open');
}

$('#collection-grid').addEventListener('click', event => {
  const button = event.target.closest('[data-work]');
  if (button) showWork(button.dataset.work, button);
});
$('#view-work').addEventListener('click', event => showWork(works[active].id, event.currentTarget));
$('#dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
dialog.addEventListener('close', () => {
  document.body.classList.remove('dialog-open');
  focusReturn?.focus({ preventScroll: true });
});
$('#detail-inquire').addEventListener('click', event => {
  const work = works.find(item => item.id === event.currentTarget.dataset.work);
  $('#artwork-interest').value = work.title;
  $('#inquiry-context').hidden = false;
  $('#inquiry-context span').textContent = work.title;
  // The dialog's deferred close event must restore focus to the inquiry,
  // not return it to the gallery after we've moved to the signup section.
  focusReturn = $('#signup-email');
  dialog.close();
  $('#studio-list').scrollIntoView({ behavior: reduced.matches ? 'instant' : 'smooth' });
  $('#signup-email').focus({ preventScroll: true });
});
$('#clear-interest').addEventListener('click', () => {
  $('#artwork-interest').value = '';
  $('#inquiry-context').hidden = true;
});
$('#previous-work').addEventListener('click', () => goTo(active - 1));
$('#next-work').addEventListener('click', () => goTo(active + 1));
$('#stop-select').innerHTML = works.map((work, index) => `<option value="${index}">${String(index + 1).padStart(2, '0')} · ${work.title}</option>`).join('');
$('#stop-select').addEventListener('change', event => goTo(Number(event.target.value)));
$('#room-stops').innerHTML = works.map((work, index) => `<button type="button" data-stop="${index}" aria-label="Go to ${work.title}" title="${work.title}"><span>${String(index + 1).padStart(2, '0')}</span></button>`).join('');
$('#room-stops').addEventListener('click', event => {
  const button = event.target.closest('[data-stop]');
  if (button) goTo(Number(button.dataset.stop));
});
shell.addEventListener('keydown', event => {
  if (event.target.matches('input,select,textarea') || dialog.open) return;
  if (['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) {
    event.preventDefault();
    goTo(event.key === 'Home' ? 0 : event.key === 'End' ? works.length - 1 : active + (event.key === 'ArrowRight' ? 1 : -1));
  }
});
let touch;
roomHost.addEventListener('pointerdown', event => { touch = { x: event.clientX, y: event.clientY }; });
roomHost.addEventListener('pointercancel', () => { touch = undefined; });
roomHost.addEventListener('pointerup', event => {
  if (!touch) return;
  const dx = event.clientX - touch.x, dy = event.clientY - touch.y;
  if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.3) goTo(active + (dx < 0 ? 1 : -1));
  touch = undefined;
});
document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => setMode(button.dataset.mode)));
document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
  filter = button.dataset.filter;
  document.querySelectorAll('[data-filter]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  renderCollection();
}));
reduced.addEventListener('change', event => { if (event.matches) setMode('collection'); });
document.addEventListener('visibilitychange', () => engine?.setEnabled(!document.hidden && mode === 'walkthrough'));
const visibility = new IntersectionObserver(entries => {
  engine?.setEnabled(entries[0].isIntersecting && mode === 'walkthrough' && !document.hidden);
});
visibility.observe(shell);
renderCollection(); goTo(0);
document.documentElement.classList.add('has-gallery');
setMode(mode);
