import { gsap } from 'gsap';
import { journey } from '../data/journey.js';
import { openProject, formatDate } from './projectModal.js';
import '../journey.css';

const SVG_NS = 'http://www.w3.org/2000/svg';

// RANDOM LAYOUT: change this number to get a different random zigzag.
// The same number always gives the same layout (so it does not jump around when you resize).
const SEED = 6;

// tiny seeded random generator
function makeRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function initJourney() {
  const scroller = document.querySelector('#journeyScroll');
  const track = document.querySelector('#journeyTrack');
  if (!scroller || !track || !journey.length) return;

  const count = journey.length;

  // shape: 'Card' or 'Dot' (any capital letters). "type" still works too.
  // If you leave both out, entries alternate card, dot, card, dot ...
  const isCard = (i) => {
    const shape = String(journey[i].shape || journey[i].type || '').toLowerCase();
    if (shape === 'card') return true;
    if (shape === 'dot') return false;
    return i % 2 === 0;
  };
  const firstParagraph = (text = '') => text.split(/\n+/)[0];

  // ---------- Lines layer ----------
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'j-lines');
  track.appendChild(svg);

  // ---------- Build the nodes (photo cards and dots) ----------
  const nodes = journey.map((p, i) => {
    const card = isCard(i);
    const date = p.date ? formatDate(p.date) : '';

    const el = document.createElement('div');
    el.className = `j-node ${card ? 'j-card' : 'j-dot'}`;
    el.dataset.i = i;
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', p.title);
    el.tabIndex = 0;
    el.style.setProperty('--i', i);
    el.style.setProperty('--c', p.color || 'var(--accent)');

    el.innerHTML = card
      ? `
        ${date ? `<span class="j-date">${date}</span>` : ''}
        <div class="j-card-box">
          <div class="j-card-img">
            ${
              p.image
                ? `<img src="${p.image}" alt="${p.title}" draggable="false" />`
                : `<span class="j-card-letter">${p.title.charAt(0)}</span>`
            }
          </div>
          <div class="j-card-title">${p.title}</div>
        </div>`
      : `
        <span class="j-circle"></span>
        <h3>${p.title}</h3>
        <p>${firstParagraph(p.description)}</p>
        ${date ? `<span class="j-date">${date}</span>` : ''}`;

    track.appendChild(el);
    return { el, card };
  });

  // ---------- Layout: random heights, connected by dashed lines ----------
  function layout() {
    const mobile = window.innerWidth < 768;
    const NODE_W = mobile ? 210 : 260;  // width of one card / dot
    const STEP = mobile ? 210 : 290;    // horizontal distance from one entry to the next
    const RANGE = mobile ? 170 : 230;   // how far up/down entries can wander (bigger = wilder)
    const MIN_JUMP = mobile ? 50 : 80;  // smallest height difference between two neighbours
    const PAD = mobile ? 40 : 90;       // empty space at the start and the end
    const DOT = 22;                     // circle size

    track.style.setProperty('--node-w', `${NODE_W}px`);
    track.style.setProperty('--dot', `${DOT}px`);

    const heights = nodes.map((n) => n.el.offsetHeight);
    const rand = makeRandom(SEED);

    // pick a random top position for every node
    const tops = [];
    const centers = []; // where each line connects
    nodes.forEach((node, i) => {
      let top = 0;
      let center = 0;
      for (let tries = 0; tries < 30; tries++) {
        top = Math.round(rand() * RANGE);
        center = node.card ? top + heights[i] / 2 : top + DOT / 2;
        if (i === 0 || Math.abs(center - centers[i - 1]) >= MIN_JUMP) break;
      }
      tops.push(top);
      centers.push(center);
    });

    const width = PAD * 2 + (count - 1) * STEP + NODE_W;
    const height = Math.max(...nodes.map((n, i) => tops[i] + heights[i])) + 10;
    track.style.width = `${width}px`;
    track.style.height = `${height}px`;

    const points = nodes.map((node, i) => {
      const x = PAD + i * STEP;
      node.el.style.left = `${x}px`;
      node.el.style.top = `${tops[i]}px`;
      return { x: x + NODE_W / 2, y: centers[i] };
    });

    // ---------- dashed, moving lines ----------
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.replaceChildren();

    const defs = document.createElementNS(SVG_NS, 'defs');
    svg.appendChild(defs);

    for (let i = 0; i < count - 1; i++) {
      const a = points[i];
      const b = points[i + 1];
      const d = `M${a.x} ${a.y} L${b.x} ${b.y}`;

      // a hidden solid line inside a mask: it "draws itself" and uncovers the dashed line
      const mask = document.createElementNS(SVG_NS, 'mask');
      mask.setAttribute('id', `j-mask-${i}`);
      mask.setAttribute('maskUnits', 'userSpaceOnUse');
      mask.setAttribute('x', 0);
      mask.setAttribute('y', 0);
      mask.setAttribute('width', width);
      mask.setAttribute('height', height);

      const reveal = document.createElementNS(SVG_NS, 'path');
      reveal.setAttribute('d', d);
      reveal.setAttribute('pathLength', '1');
      reveal.setAttribute('class', 'j-reveal');
      reveal.style.transitionDelay = `${i * 0.18 + 0.1}s`;
      mask.appendChild(reveal);
      defs.appendChild(mask);

      // the visible dashed line
      const line = document.createElementNS(SVG_NS, 'path');
      line.setAttribute('d', d);
      line.setAttribute('class', 'j-line');
      line.setAttribute('mask', `url(#j-mask-${i})`);
      line.style.stroke = journey[i + 1].color || 'var(--accent)';
      svg.appendChild(line);
    }
  }

  layout();

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(layout, 120);
  });
  window.addEventListener('load', layout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);

  // ---------- Reveal on scroll (plays when it appears, rewinds when it leaves) ----------
  new IntersectionObserver(
    ([entry]) => track.classList.toggle('visible', entry.isIntersecting),
    { threshold: 0.2 }
  ).observe(scroller);

  // ---------- Click / keyboard: open the popup ----------
  let moved = false; // true if the last mouse gesture was a drag

  track.addEventListener('click', (e) => {
    if (moved) return;
    const node = e.target.closest('.j-node');
    if (node) openProject(Number(node.dataset.i), journey);
  });

  track.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const node = e.target.closest('.j-node');
    if (node) {
      e.preventDefault();
      openProject(Number(node.dataset.i), journey);
    }
  });

  // ---------- Hold and drag with the mouse (touch screens just swipe) ----------
  const glide = { v: 0 };
  let down = false;
  let startX = 0;
  let startScroll = 0;
  let lastX = 0;
  let lastT = 0;
  let velocity = 0;

  scroller.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    down = true;
    moved = false;
    startX = lastX = e.clientX;
    startScroll = scroller.scrollLeft;
    lastT = performance.now();
    velocity = 0;
    gsap.killTweensOf(glide);
    scroller.classList.add('dragging');
  });

  window.addEventListener('pointermove', (e) => {
    if (!down) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 5) moved = true;

    const now = performance.now();
    const dt = now - lastT;
    if (dt > 0) velocity = (e.clientX - lastX) / dt;
    lastX = e.clientX;
    lastT = now;

    scroller.scrollLeft = startScroll - dx;
  });

  function endDrag() {
    if (!down) return;
    down = false;
    scroller.classList.remove('dragging');

    // keep gliding a little after you let go
    const max = scroller.scrollWidth - scroller.clientWidth;
    const target = Math.max(0, Math.min(max, scroller.scrollLeft - velocity * 260));
    glide.v = scroller.scrollLeft;
    gsap.to(glide, {
      v: target,
      duration: 0.9,
      ease: 'power3.out',
      onUpdate: () => { scroller.scrollLeft = glide.v; },
    });
  }

  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);
}