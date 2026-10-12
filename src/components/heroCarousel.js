import { gsap } from 'gsap';
import { projects } from '../data/projects.js';
import heroBg from '../data/Images/HomePageBG.png';

// light-theme background: finds WhiteHomePageBG.png / .jpg / .webp ... whatever you saved
const lightFiles = import.meta.glob('../data/Images/WhiteHomePageBG.*', { eager: true, import: 'default' });
const heroBgLight = Object.values(lightFiles)[0];
import { openProject } from './projectModal.js';

// What happens when you click the CENTER card:
//   'link'  -> opens the project link (GitHub, website...)
//   'popup' -> opens the project detail popup
const CENTER_CLICK = 'link';

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const mod = (v, n) => ((v % n) + n) % n;

export function initHeroCarousel() {
  // hero background image (behind the title)
  const bg = document.querySelector('.hero-bg');
  if (bg) {
    bg.style.backgroundImage = `url(${heroBg})`;

    // second layer for the light theme (CSS cross-fades between the two when you toggle the theme)
    if (heroBgLight) {
      bg.classList.add('has-light-pair');
      const bgLight = bg.cloneNode(false);
      bgLight.classList.add('hero-bg-light');
      bgLight.style.backgroundImage = `url(${heroBgLight})`;
      bg.insertAdjacentElement('afterend', bgLight);
    }
  }

  const root = document.querySelector('#heroCarousel');
  if (!root || !projects.length) return;

  const n = projects.length;
  const last = n - 1;
  const loop = n >= 3; // endless looping needs at least 3 projects

  // shortest signed distance on a circle: always lands between -n/2 and +n/2
  const wrap = (v) => mod(v + n / 2, n) - n / 2;

  // how far from the center a card can be before it has fully faded out
  const limit = loop ? Math.min(2.6, n / 2) : 2.6;
  const fadeWidth = loop ? Math.min(0.8, Math.max(limit - 1, 0.3)) : 0.8;

  // ---------- Build DOM ----------
  root.innerHTML = `
    <div class="hero-stage">
      ${projects.map((p) => `
        <article class="hero-card">
          ${
            p.image
              ? `<img src="${p.image}" alt="${p.title}" draggable="false" />`
              : `<div class="hero-card-placeholder">${p.title.charAt(0)}</div>`
          }
          <div class="hero-card-caption">${p.title}</div>
        </article>
      `).join('')}
      <button class="hero-arrow prev" aria-label="Previous project">&#8249;</button>
      <button class="hero-arrow next" aria-label="Next project">&#8250;</button>
    </div>
    <div class="hero-dots">
      ${projects.map((_, i) => `<button class="hero-dot" aria-label="Go to project ${i + 1}" data-i="${i}"></button>`).join('')}
    </div>
  `;

  const stage = root.querySelector('.hero-stage');
  const cards = [...root.querySelectorAll('.hero-card')];
  const dots = [...root.querySelectorAll('.hero-dot')];
  const prevBtn = root.querySelector('.hero-arrow.prev');
  const nextBtn = root.querySelector('.hero-arrow.next');

  // state.pos is a FLOAT (e.g. 1.4 = between card 1 and 2) so dragging feels continuous
  const state = { pos: 0 };
  const spacing = () => cards[0].offsetWidth * 0.75;
  const current = () =>
    loop ? mod(Math.round(state.pos), n) : clamp(Math.round(state.pos), 0, last);

  // ---------- Layout: position every card based on its distance from pos ----------
  function layout() {
    const gap = spacing();

    cards.forEach((card, i) => {
      const d = loop ? wrap(i - state.pos) : i - state.pos;
      const a = Math.abs(d);

      const x = d * gap;
      const scale = Math.max(0.5, 1 - a * 0.2);
      // fade out smoothly at the edges (fully invisible exactly where a card wraps around)
      const fade = clamp((limit - a) / fadeWidth, 0, 1);
      const opacity = fade * (1 - Math.min(a, 2) * 0.12);

      card.style.transform = `translate(-50%, -50%) translateX(${x}px) scale(${scale})`;
      card.style.opacity = opacity;
      card.style.zIndex = 100 - Math.round(a * 10);
      card.style.pointerEvents = opacity < 0.05 ? 'none' : 'auto';
      card.classList.toggle('active', a < 0.5);
    });

    const idx = current();
    dots.forEach((dot, i) => dot.classList.toggle('active', i === idx));

    // with looping the arrows are never disabled
    prevBtn.disabled = !loop && idx === 0;
    nextBtn.disabled = !loop && idx === last;
  }

  function goTo(target) {
    const t = loop ? target : clamp(target, 0, last);
    gsap.to(state, {
      pos: t,
      duration: 0.75,
      ease: 'power3.out',
      overwrite: true,
      onUpdate: layout,
      onComplete: () => {
        // keep the number small (looks identical, because positions repeat every n cards)
        if (loop) {
          state.pos = mod(state.pos, n);
          layout();
        }
      },
    });
  }

  // go to project number i by the SHORTEST way around the loop
  function goToIndex(i) {
    if (!loop) return goTo(i);
    const base = Math.round(state.pos);
    goTo(base + wrap(i - base));
  }

  // ---------- Arrows / dots / card click ----------
  prevBtn.addEventListener('click', () => goTo(Math.round(state.pos) - 1));
  nextBtn.addEventListener('click', () => goTo(Math.round(state.pos) + 1));
  dots.forEach((dot) => dot.addEventListener('click', () => goToIndex(Number(dot.dataset.i))));

  let moved = false; // true if the last pointer gesture was a drag (suppresses clicks)

  cards.forEach((card, i) => {
    card.addEventListener('click', () => {
      if (moved) return;
      if (i !== current()) {
        goToIndex(i);
      } else if (CENTER_CLICK === 'popup') {
        openProject(i);
      } else if (projects[i].link) {
        window.open(projects[i].link, '_blank', 'noopener');
      }
    });
  });

  // ---------- Drag to scroll ----------
  let dragging = false;
  let startX = 0;
  let startPos = 0;
  let lastX = 0;
  let lastT = 0;
  let velocity = 0; // px per ms

  stage.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.hero-arrow')) return;
    dragging = true;
    moved = false;
    startX = lastX = e.clientX;
    lastT = performance.now();
    velocity = 0;
    gsap.killTweensOf(state);
    if (loop) state.pos = mod(state.pos, n);
    startPos = state.pos;
    root.classList.add('dragging');
  });

  window.addEventListener('pointermove', (e) => {
    if (!dragging) return;

    const dx = e.clientX - startX;
    if (Math.abs(dx) > 6) moved = true;

    const now = performance.now();
    const dt = now - lastT;
    if (dt > 0) velocity = (e.clientX - lastX) / dt;
    lastX = e.clientX;
    lastT = now;

    const raw = startPos - dx / spacing();
    // looping: no limits at all. Not looping: small rubber-band overshoot at the ends.
    state.pos = loop ? raw : clamp(raw, -0.35, last + 0.35);
    layout();
  });

  function endDrag() {
    if (!dragging) return;
    dragging = false;
    root.classList.remove('dragging');

    // add a little "flick" momentum so a quick swipe moves further
    const projected = state.pos - (velocity * 160) / spacing();
    goTo(Math.round(projected));
  }

  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);

  window.addEventListener('resize', layout);

  // ---------- Intro ----------
  layout();
  gsap.from(root, { opacity: 0, y: 40, duration: 1, delay: 0.3, ease: 'power3.out' });
}