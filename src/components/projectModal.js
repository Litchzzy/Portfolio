import { projects } from '../data/projects.js';
import '../projectModal.css';

const AUTO_MS = 4000; // time between automatic image swaps (milliseconds)
const LAYOUTS = ['left', 'right', 'top', 'bottom'];

const chevron = `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 15 12 9 18 15"/></svg>`;
const closeIcon = `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>`;

let overlay, panel, gallery, slidesEl, dotsEl, infoEl;
let items = projects; // the list the popup is showing (projects OR journey entries)
let current = 0;
let isOpen = false;
let swapping = false;

let imgs = [];
let imgIndex = 0;
let timer = null;

let dragging = false;
let dragStartX = 0;
let dragDX = 0;
let justDragged = false;

// ---------- Date: 'YYYY-MM-DD' or 'YYYY-MM' is formatted nicely, empty = today, anything else is shown as typed ----------
export function formatDate(value) {
  let date = new Date();
  if (value) {
    const full = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    const month = /^(\d{4})-(\d{2})$/.exec(value);
    if (full) {
      date = new Date(Number(full[1]), Number(full[2]) - 1, Number(full[3]));
    } else if (month) {
      date = new Date(Number(month[1]), Number(month[2]) - 1, 1);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    } else {
      return value;
    }
  }
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

// ---------- Build the popup once ----------
function build() {
  overlay = document.createElement('div');
  overlay.className = 'pm-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-hidden', 'true');

  overlay.innerHTML = `
    <button class="pm-nav pm-prev" aria-label="Previous">${chevron}</button>

    <div class="pm-panel pm-right">
      <button class="pm-close" aria-label="Close">${closeIcon}</button>
      <div class="pm-gallery">
        <div class="pm-slides"></div>
        <div class="pm-dots"></div>
      </div>
      <div class="pm-info"></div>
    </div>

    <button class="pm-nav pm-next" aria-label="Next">${chevron}</button>
  `;

  document.body.appendChild(overlay);

  panel = overlay.querySelector('.pm-panel');
  gallery = overlay.querySelector('.pm-gallery');
  slidesEl = overlay.querySelector('.pm-slides');
  dotsEl = overlay.querySelector('.pm-dots');
  infoEl = overlay.querySelector('.pm-info');

  // close: backdrop click, X button, Escape
  overlay.addEventListener('click', (e) => {
    if (justDragged) return;
    if (e.target === overlay) closeProject();
  });
  overlay.querySelector('.pm-close').addEventListener('click', closeProject);

  // next / previous item
  overlay.querySelector('.pm-prev').addEventListener('click', () => openItem(current - 1));
  overlay.querySelector('.pm-next').addEventListener('click', () => openItem(current + 1));

  // image dots
  dotsEl.addEventListener('click', (e) => {
    const dot = e.target.closest('.pm-dot');
    if (dot) showImage(Number(dot.dataset.i));
  });

  // keyboard
  document.addEventListener('keydown', (e) => {
    if (!isOpen) return;
    if (e.key === 'Escape') closeProject();
    if (e.key === 'ArrowRight') openItem(current + 1);
    if (e.key === 'ArrowLeft') openItem(current - 1);
  });

  // ---------- Drag the images to swap ----------
  gallery.addEventListener('pointerdown', (e) => {
    if (imgs.length < 2 || e.target.closest('.pm-dot')) return;
    dragging = true;
    dragStartX = e.clientX;
    dragDX = 0;
    gallery.classList.add('dragging');
    stopTimer();
  });

  window.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    dragDX = e.clientX - dragStartX;
    const active = slidesEl.querySelector('.pm-slide.active');
    if (active) active.style.transform = `translateX(${dragDX * 0.6}px)`;
  });

  function endDrag() {
    if (!dragging) return;
    dragging = false;
    gallery.classList.remove('dragging');

    if (Math.abs(dragDX) > 5) {
      justDragged = true; // stops the backdrop "click" from closing the popup after a drag
      setTimeout(() => { justDragged = false; }, 60);
    }

    const threshold = 60;
    if (dragDX < -threshold) {
      showImage(imgIndex + 1);
    } else if (dragDX > threshold) {
      showImage(imgIndex - 1);
    } else {
      const active = slidesEl.querySelector('.pm-slide.active');
      if (active) active.style.transform = '';
      startTimer();
    }
  }

  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);
}

// ---------- Auto-swipe ----------
function stopTimer() {
  clearInterval(timer);
  timer = null;
}

function startTimer() {
  stopTimer();
  if (isOpen && imgs.length > 1) {
    timer = setInterval(() => showImage(imgIndex + 1), AUTO_MS);
  }
}

function showImage(n) {
  if (imgs.length < 2) return;
  imgIndex = (n + imgs.length) % imgs.length;

  slidesEl.querySelectorAll('.pm-slide').forEach((slide, k) => {
    const active = k === imgIndex;
    slide.classList.toggle('active', active);
    if (active) slide.style.transform = '';
  });

  dotsEl.querySelectorAll('.pm-dot').forEach((dot, k) => {
    dot.classList.toggle('active', k === imgIndex);
  });

  startTimer();
}

// ---------- Fill the popup with one item ----------
function render(index) {
  current = index;
  const p = items[index];

  overlay.classList.toggle('single', items.length < 2);
  overlay.style.setProperty('--pm-color', p.color || '#1e3a5f');

  const layout = LAYOUTS.includes(p.layout) ? p.layout : 'right';
  panel.className = `pm-panel pm-${layout}`;

  imgs = p.images && p.images.length ? p.images : p.image ? [p.image] : [];
  imgIndex = 0;

  slidesEl.innerHTML = imgs.length
    ? imgs
        .map(
          (src, k) =>
            `<img class="pm-slide${k === 0 ? ' active' : ''}" src="${src}" alt="${p.title} image ${k + 1}" draggable="false" />`
        )
        .join('')
    : `<div class="pm-empty">${p.title.charAt(0)}</div>`;

  dotsEl.innerHTML =
    imgs.length > 1
      ? imgs.map((_, k) => `<button class="pm-dot${k === 0 ? ' active' : ''}" data-i="${k}" aria-label="Image ${k + 1}"></button>`).join('')
      : '';

  gallery.classList.toggle('pm-multi', imgs.length > 1);

  const paragraphs = (p.description || '')
    .split(/\n+/)
    .filter(Boolean)
    .map((t) => `<p>${t}</p>`)
    .join('');

  // no "date" line at all in the data = no date shown (journey entries); date: '' = today
  const dateText = p.date === undefined ? '' : formatDate(p.date);

  infoEl.innerHTML = `
    ${dateText ? `<span class="pm-date">${dateText}</span>` : ''}
    <h2>${p.title}</h2>
    <div class="pm-tags">${(p.tags || []).map((t) => `<span class="pm-tag">${t}</span>`).join('')}</div>
    ${paragraphs}
    ${p.link ? `<a class="pm-link" href="${p.link}" target="_blank" rel="noopener">View Project &rarr;</a>` : ''}
  `;
  infoEl.scrollTop = 0;

  startTimer();
}

// ---------- Open / switch ----------
function openItem(index, list) {
  if (!overlay) build();
  if (!isOpen && list) items = list;

  const next = (index + items.length) % items.length;

  // already open: fade out, swap content, fade back in
  if (isOpen) {
    if (swapping) return;
    swapping = true;
    overlay.classList.add('swap');
    setTimeout(() => {
      render(next);
      overlay.classList.remove('swap');
      swapping = false;
    }, 350);
    return;
  }

  isOpen = true;
  render(next);
  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.classList.add('no-scroll');
}

// Public: openProject(3)               -> opens project number 3
//         openProject(2, journeyList)  -> opens entry 2 of any other list (used by the Journey section)
export function openProject(index, list = projects) {
  openItem(index, list);
}

export function closeProject() {
  if (!isOpen) return;
  isOpen = false;
  stopTimer();
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('no-scroll');
}