import { works } from './src/catalog.js';
const $=s=>document.querySelector(s);const reduced=matchMedia('(prefers-reduced-motion: reduce)');const world=$('#world'),travel=$('#travel');let engine,loading,failed=false,mode='collection',progress=0,active=0,lastPaint=-1,focusReturn;let scheduled=false;let freeze=false;
const END=works.length;
const stops=[...works.map(w=>w.title),'Studio list'];
const formStop=$('#studio-list');
let focusForm=false;
const clamp=x=>Math.max(0,Math.min(END,x));
$('#work-select').innerHTML=stops.map((title,i)=>`<option value="${i}">${title}</option>`).join('');
$('#gallery-map').innerHTML=stops.map((title,i)=>`<button type="button" data-stop="${i}">${title}</button>`).join('');
$('#works').innerHTML=works.map((w,i)=>`<figure><button type="button" data-work="${i}" aria-label="View ${w.title}"><img src="${w.src}" alt="${w.alt}" loading="lazy"><figcaption>${w.title}</figcaption></button><p>${w.medium}${w.medium==='Artwork'?' · Working title':''}</p></figure>`).join('');
function span(){return Math.max(1,travel.offsetHeight-innerHeight)}
function sizeTrack(){travel.style.height=`${innerHeight+END*innerHeight*1.6}px`}
function paint(value,position=[]){
  const ending=value>=END-.35;
  world.classList.toggle('form-ending',ending);
  formStop.hidden=mode==='walkthrough'&&!ending;
  if(ending&&focusForm){focusForm=false;($('#thank-you').hidden?$('#signup-email'):$('#thank-you')).focus({preventScroll:true})}
  const next=Math.round(value);
  world.dataset.scVerifyState=JSON.stringify(position.map(n=>Math.round(n*100)/100));
  $('#journey-progress').style.transform=`scaleX(${value/END})`;
  if(next===lastPaint)return;
  lastPaint=next;active=next;
  const work=works[active];
  $('#work-title').textContent=work?.title||'The studio list';
  $('#work-category').textContent=work?.category||'Stay in touch';
  $('#work-medium').textContent=work?.medium||'A first look at what comes next';
  $('#inspect').hidden=!work;
  $('#work-select').value=String(active);
  $('#prev').disabled=active===0;
  $('#next').disabled=active===END;
  document.querySelectorAll('[data-stop]').forEach(b=>b.setAttribute('aria-current',Number(b.dataset.stop)===active?'step':'false'));
}
function update(){scheduled=false;if(mode!=='walkthrough'||freeze)return;progress=clamp(scrollY/span()*END);engine?.goTo(reduced.matches?Math.round(progress):progress);if(!engine)paint(progress)}
function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(update)}}
function goTo(stop){if(mode!=='walkthrough')return;const next=clamp(stop);window.scrollTo({top:next/END*span(),behavior:reduced.matches?'instant':'smooth'})}
function fail(){failed=true;engine?.dispose();engine=undefined;$('#fallback-note').textContent='The 3D room could not open on this device. Every artwork is available in the collection.';setMode('collection')}
async function load(){if(engine||loading||failed)return;loading=true;try{const module=await import('./vendor/room.js');const ready=await module.createRoom($('#canvas'),progress,fail,paint);if(failed){ready.dispose();return}engine=ready;world.dataset.ready='true';$('#load-state').textContent='Move at your own pace.';engine.setEnabled(mode==='walkthrough'&&!document.hidden);update()}catch{fail()}finally{loading=false}}
function setMode(next){
  mode=next;
  const walking=next==='walkthrough'&&!failed;
  world.hidden=!walking;travel.hidden=!walking;$('#collection').hidden=walking;
  $('#walk-mode').setAttribute('aria-pressed',String(walking));
  $('#collection-mode').setAttribute('aria-pressed',String(!walking));
  (walking?$('#form-mount'):$('#collection-form')).append(formStop);
  formStop.hidden=walking&&progress<END-.35;
  engine?.setEnabled(walking&&!document.hidden);
  if(walking){sizeTrack();window.scrollTo({top:progress/END*span(),behavior:'instant'});load();schedule()}
  else window.scrollTo({top:0,behavior:'instant'});
}
function show(index,opener){const w=works[index];if(!w)return;freeze=true;focusReturn=opener;$('#detail-inquire').dataset.work=String(index);$('#detail-title').textContent=w.title;$('#detail-category').textContent=w.category+' · '+w.medium;$('#detail-photo').src=w.src;$('#detail-photo').alt=w.alt;$('#detail-description').textContent=w.description;$('#detail-note').textContent=w.note;const toggle=$('#detail-crop');toggle.hidden=!w.detailSrc;toggle.textContent='View detail photograph';let detail=false;toggle.onclick=()=>{detail=!detail;$('#detail-photo').src=detail?w.detailSrc:w.src;toggle.textContent=detail?'View full piece':'View detail photograph'};$('#details').showModal();document.body.classList.add('dialog-open');engine?.setEnabled(false)}
$('#details').addEventListener('close',()=>{document.body.classList.remove('dialog-open');freeze=false;focusReturn?.focus({preventScroll:true});engine?.setEnabled(mode==='walkthrough'&&!document.hidden);schedule()});$('#close').addEventListener('click',()=>$('#details').close());$('#details').addEventListener('click',e=>{if(e.target===$('#details'))$('#details').close()});$('#inspect').addEventListener('click',e=>show(active,e.currentTarget));$('#works').addEventListener('click',e=>{const b=e.target.closest('[data-work]');if(b)show(Number(b.dataset.work),b)});
let pointer;
$('#canvas').addEventListener('pointerdown',e=>{pointer={x:e.clientX,y:e.clientY}});
$('#canvas').addEventListener('pointercancel',()=>pointer=null);
$('#canvas').addEventListener('pointerup',e=>{if(!pointer)return;const distance=Math.hypot(e.clientX-pointer.x,e.clientY-pointer.y);pointer=null;if(distance>8)return;const picked=engine?.pick(e.clientX,e.clientY);if(picked!==null&&picked!==undefined)show(picked,$('#inspect'))});
$('#gallery-map').addEventListener('click',e=>{const b=e.target.closest('[data-stop]');if(b)goTo(Number(b.dataset.stop))});$('#work-select').addEventListener('change',e=>goTo(Number(e.target.value)));$('#prev').addEventListener('click',()=>goTo(active-1));$('#next').addEventListener('click',()=>goTo(active+1));$('#walk-mode').addEventListener('click',()=>setMode('walkthrough'));$('#collection-mode').addEventListener('click',()=>setMode('collection'));
addEventListener('scroll',schedule,{passive:true});addEventListener('resize',()=>{if(mode==='walkthrough'){sizeTrack();window.scrollTo({top:progress/END*span(),behavior:'instant'});schedule()}});
addEventListener('keydown',e=>{if(mode!=='walkthrough'||$('#details').open||e.target.matches('select,input,textarea')||e.target.closest('.form-stop'))return;if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();goTo(e.key==='Home'?0:e.key==='End'?END:active+(e.key==='ArrowRight'?1:-1))}});
document.addEventListener('visibilitychange',()=>engine?.setEnabled(!document.hidden&&!freeze&&mode==='walkthrough'));reduced.addEventListener('change',e=>{if(e.matches)setMode('collection')});setMode(reduced.matches?'collection':'walkthrough');paint(0);

function joinStudio(){
  if(mode==='walkthrough'){focusForm=true;goTo(END);if(progress>=END-.35)paint(progress)}
  else {formStop.scrollIntoView({behavior:reduced.matches?'instant':'smooth'});($('#thank-you').hidden?$('#signup-email'):$('#thank-you')).focus({preventScroll:true})}
}
document.querySelectorAll('[data-join]').forEach(button=>button.addEventListener('click',joinStudio));
$('#detail-inquire').addEventListener('click',()=>{
 const work=works[Number($('#detail-inquire').dataset.work)];
 $('#artwork-interest').value=work.title;$('#inquiry-context').hidden=false;$('#inquiry-context span').textContent=work.title;
 focusReturn=null;$('#details').close();freeze=false;joinStudio();
});
$('#clear-interest').addEventListener('click',()=>{$('#artwork-interest').value='';$('#inquiry-context').hidden=true});

$('#first-work').addEventListener('click',()=>goTo(0));
function openLinkedSection(){
 if(location.hash==='#studio-list')joinStudio();
 else if(location.hash==='#collection')setMode('collection');
}
window.addEventListener('hashchange',openLinkedSection);
openLinkedSection();
