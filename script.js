'use strict';
const SHEET_URL = "https://opensheet.elk.sh/1oSAvRDiEZjLkqtsUgakFVGTM39uPEo_aFjRC1rkXBRE/Лист1";
const numberFormat = new Intl.NumberFormat('ru-RU');
const CACHE_KEY = 'pirog-progress-v1';
const statusNode = document.getElementById('counter-status');
const retryButton = document.getElementById('retry-counter');

function validateProgress(row) {
  if (!row || ['sold', 'target', 'profit'].some(key => row[key] == null || String(row[key]).trim() === '')) throw new Error('Missing progress values');
  const sold = Number(row.sold), target = Number(row.target), profit = Number(row.profit);
  if (!Number.isSafeInteger(sold) || sold < 0 || !Number.isSafeInteger(target) || target <= 0 || !Number.isFinite(profit) || profit < 0 || !Number.isFinite(sold * profit)) throw new Error('Invalid progress values');
  return {sold, target, profit};
}
function renderProgress(data) {
  const {sold, target, profit} = data;
  document.getElementById('sold').textContent = numberFormat.format(sold);
  document.getElementById('target').textContent = numberFormat.format(target);
  document.getElementById('left').textContent = numberFormat.format(Math.max(0, target - sold));
  document.getElementById('money').textContent = numberFormat.format(Math.round(sold * profit)) + ' ₽';
  document.getElementById('percent').textContent = (sold / target * 100).toLocaleString('ru-RU', {maximumFractionDigits: 1}) + '% цели';
  document.getElementById('fill').style.width = Math.min(100, sold / target * 100) + '%';
  const bar = document.getElementById('progressbar');
  bar.setAttribute('aria-valuemax', target);
  bar.setAttribute('aria-valuenow', Math.min(sold, target));
  bar.setAttribute('aria-valuetext', numberFormat.format(sold) + ' из ' + numberFormat.format(target) + ' пирогов');
  document.getElementById('counter-note').textContent = 'Расчёт по таблице продаж: ' + numberFormat.format(profit) + ' ₽ с каждого пирога на пространство.';
}
async function loadProgress() {
  retryButton.hidden = true;
  statusNode.textContent = '';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(SHEET_URL, {signal: controller.signal, cache: 'no-store'});
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const rows = await response.json();
    const data = validateProgress(rows[0]);
    renderProgress(data);
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({data, savedAt: Date.now()})); } catch (_) { /* The counter also works without storage. */ }
  } catch (_) {
    let cached = null;
    try {
      const value = JSON.parse(localStorage.getItem(CACHE_KEY));
      if (value && Number.isFinite(value.savedAt) && value.savedAt > 0 && value.savedAt <= Date.now()) cached = {data: validateProgress(value.data), savedAt: value.savedAt};
    } catch (_) { /* A missing or invalid cache is not a zero-sales total. */ }
    if (cached) {
      renderProgress(cached.data);
      statusNode.textContent = 'Нет связи с таблицей. Показаны сохранённые данные от ' + new Date(cached.savedAt).toLocaleDateString('ru-RU') + '.';
    } else {
      document.getElementById('percent').textContent = 'Цель — 7 000 пирогов';
      statusNode.textContent = 'Счётчик временно недоступен. Заказать пирог можно ниже.';
      document.getElementById('progressbar').setAttribute('aria-valuetext', 'Данные временно недоступны');
    }
    retryButton.hidden = false;
  } finally { clearTimeout(timeout); }
}
retryButton.addEventListener('click', loadProgress);
loadProgress();

// Only supplied documentary photos are displayed; empty galleries take no space.
function localMediaPath(path) {
  return typeof path === 'string' && /^images\/[a-zA-Z0-9_./-]+$/.test(path) && !path.includes('..') ? path : null;
}
function mountGallery(id, photos) {
  const container = document.getElementById(id);
  if (!Array.isArray(photos)) return;
  for (const photo of photos) {
    const src = localMediaPath(photo.src);
    if (!src || !photo.alt) continue;
    const figure = document.createElement('figure');
    const img = document.createElement('img');
    img.src = src; img.alt = photo.alt; img.loading = 'lazy'; img.decoding = 'async';
    figure.append(img);
    if (photo.caption) { const caption = document.createElement('figcaption'); caption.textContent = photo.caption; figure.append(caption); }
    container.append(figure);
  }
  container.hidden = !container.children.length;
}
const media = window.SITE_MEDIA || {};
mountGallery('class-gallery', media.classPhotos);
mountGallery('space-gallery', media.spacePhotos);
if (media.video && localMediaPath(media.video.src) && localMediaPath(media.video.poster)) {
  const container = document.getElementById('class-video');
  const video = document.createElement('video');
  video.src = media.video.src; video.poster = media.video.poster;
  video.controls = true; video.preload = 'none'; video.playsInline = true;
  video.setAttribute('aria-label', media.video.title || 'Жизнь семейного класса');
  container.append(video); container.hidden = false;
}

const track = document.querySelector('.pie-slides');
for (const button of document.querySelectorAll('.pie-nav')) {
  button.addEventListener('click', () => {
    const width = track.clientWidth;
    const count = track.children.length;
    const current = Math.round(track.scrollLeft / width);
    const next = (current + Number(button.dataset.step) + count) % count;
    track.scrollTo({left: next * width, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
  });
}

const viewer=document.querySelector('.viewer');
const photoButtons=Array.from(document.querySelectorAll('.class-open'));
const photos=[...photoButtons.map(b=>b.querySelector('img')),...document.querySelectorAll('.album-grid img')];
const screenPhoto=viewer.querySelector('img');
let currentPhoto=0;
function showPhoto(index){
  currentPhoto=(index+photos.length)%photos.length;
  screenPhoto.src=photos[currentPhoto].getAttribute('src');
  screenPhoto.alt=photos[currentPhoto].alt;
  viewer.querySelector('output').textContent=(currentPhoto+1)+' / '+photos.length;
}
function openPhotos(index){showPhoto(index);viewer.showModal();}
photoButtons.forEach((button,index)=>button.addEventListener('click',()=>openPhotos(index)));
document.querySelectorAll('.album-thumb').forEach((button,index)=>button.addEventListener('click',()=>openPhotos(photoButtons.length+index)));
viewer.querySelector('.close-viewer').onclick=()=>viewer.close();
viewer.querySelector('.back-photo').onclick=()=>showPhoto(currentPhoto-1);
viewer.querySelector('.next-photo').onclick=()=>showPhoto(currentPhoto+1);
viewer.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();showPhoto(currentPhoto+(e.key==='ArrowLeft'?-1:1));}});
let start=null;
screenPhoto.addEventListener('touchstart',e=>{start=e.touches.length===1?[e.touches[0].clientX,e.touches[0].clientY]:null;},{passive:true});
screenPhoto.addEventListener('touchend',e=>{if(!start)return;const dx=e.changedTouches[0].clientX-start[0],dy=e.changedTouches[0].clientY-start[1];start=null;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy))showPhoto(currentPhoto+(dx<0?1:-1));},{passive:true});

document.querySelectorAll('.space-pics img').forEach(img=>img.parentElement.addEventListener('click',event=>{event.preventDefault();viewer.querySelector('strong').textContent=img.closest('.room-pics')?'Помещение сейчас':'Мудборд будущего пространства';viewer.setAttribute('aria-label',viewer.querySelector('strong').textContent);const group=Array.from(img.closest('.space-pics').querySelectorAll('img'));photos.splice(0,photos.length,...group);openPhotos(group.indexOf(img));}));
const classPhotoSet=[...photoButtons.map(b=>b.querySelector('img')),...document.querySelectorAll('.album-grid img')];viewer.addEventListener('close',()=>photos.splice(0,photos.length,...classPhotoSet));
viewer.addEventListener('close',()=>{viewer.querySelector('strong').textContent='Жизнь семейного класса';viewer.setAttribute('aria-label','Фото из жизни класса');});