import { gsap } from 'gsap';
import { journey } from '../data/journey.js';
import { openProject, formatDate } from './projectModal.js';
import '../journey.css';

const SVG_NS = 'http://www.w3.org/2000/svg';

export function initJourney() {
  const scroller = document.querySelector('#journeyScroll');
  const track = document.querySelector('#journeyTrack');
  if (!scroller || !track || !journey.length) return;

  const count = journey.length;
  const isCard = (i) => (journey[i].type ? journey[i].type === 'card' : i % 2 === 0);
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

  // ---------- Layout: zigzag between a top row (cards) and a bottom row (dots) ----------
  function layout() {
    const mobile = window.innerWidth < 768;
    const NODE_W = mobile ? 210 : 260; // width of one card / dot
    const STEP = mobile ? 210 : 290;   // horizontal distance from one entry to the next
    const GAP = mobile ? 90 : 130;     // vertical distance between the two rows
    const PAD = mobile ? 40 : 90;      // empty space at the start and the end
    const DOT = 22;                    // circle size

    track.style.setProperty('--node-w', `${NODE_W}px`);
    track.style.setProperty('--dot', `${DOT}px`);

    const heights = nodes.map((n) => n.el.offsetHeight);
    const topH = Math.max(0, ...nodes.map((n, i) => (n.card ? heights[i] : 0)));
    const botH = Math.max(0, ...nodes.map((n, i) => (n.card ? 0 : heights[i])));
    const rowY = topH + GAP; // where the bottom row starts

    const width = PAD * 2 + (count - 1) * STEP + NODE_W;
    const height = rowY + botH + 10;
    track.style.width = `${width}px`;
    track.style.height = `${height}px`;

    // place every node and remember where its line connects
    const points = nodes.map((node, i) => {
      const x = PAD + i * STEP;
      node.el.style.left = `${x}px`;
      node.el.style.top = `${node.card ? topH - heights[i] : rowY}px`;
      return {
        x: x + NODE_W / 2,
        y: node.card ? topH + 14 : rowY + DOT / 2, // under a card / center of a circle
      };
    });

    // draw the diagonal lines
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.replaceChildren();

    for (let i = 0; i < count - 1; i++) {
      const a = points[i];
      const b = points[i + 1];
      const line = document.createElementNS(SVG_NS, 'path');
      line.setAttribute('d', `M${a.x} ${a.y} L${b.x} ${b.y}`);
      line.setAttribute('pathLength', '1');
      line.setAttribute('class', 'j-line');
      line.style.stroke = journey[i + 1].color || 'var(--accent)';
      line.style.transitionDelay = `${i * 0.18 + 0.1}s`;
      svg.appendChild(line);
    }

    // small pin under every photo card
    nodes.forEach((node, i) => {
      if (!node.card) return;
      const pin = document.createElementNS(SVG_NS, 'circle');
      pin.setAttribute('cx', points[i].x);
      pin.setAttribute('cy', points[i].y);
      pin.setAttribute('r', 5);
      pin.setAttribute('class', 'j-pin');
      pin.style.fill = journey[i].color || 'var(--accent)';
      pin.style.transitionDelay = `${i * 0.18}s`;
      svg.appendChild(pin);
    });
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