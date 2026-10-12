import { gsap } from 'gsap';
import { projects } from '../data/projects.js';
import { openProject } from './projectModal.js';
import { applyAutoColors } from '../utils/dominantColor.js';
import '../projectsMore.css';
import '../projectsLayout.css';

const INITIAL = 6; // cards shown when the page opens (keep it a multiple of 3 so the layout is complete)
const STEP = 6;    // cards added each time you press "More"

const pad = (n) => String(n).padStart(2, '0');

export function renderProjects() {
  const grid = document.querySelector('#projectsGrid');

  // ---------- Cards ----------
  grid.innerHTML = projects.map((project, i) => {
    const tags = (project.tags || []).slice(0, 3);
    const firstParagraph = (project.description || '').split(/\n+/)[0];
    return `
      <div class="project-card" data-index="${i}" role="button" tabindex="0"
           style="--card-color: ${project.color || 'var(--accent)'}">
        <div class="pc-media">
          ${
            project.image
              ? `<img src="${project.image}" alt="${project.title}" draggable="false" />`
              : `<div class="pc-placeholder">${project.title.charAt(0)}</div>`
          }
        </div>
        <div class="pc-shade"></div>
        <span class="pc-index">${pad(i + 1)}</span>
        <span class="pc-arrow">↗</span>
        <div class="pc-body">
          <div class="pc-tags">${tags.map((t) => `<span class="pc-tag">${t}</span>`).join('')}</div>
          <h3>${project.title}</h3>
          <div class="pc-more">
            <p>${firstParagraph}</p>
            ${project.link ? `<a href="${project.link}" target="_blank" rel="noopener" class="project-link">View Project →</a>` : ''}
          </div>
        </div>
      </div>`;
  }).join('');

  const cards = [...grid.querySelectorAll('.project-card')];

  // ---------- Filter chips (made from your tags) ----------
  const tagCount = {};
  projects.forEach((p) => (p.tags || []).forEach((t) => { tagCount[t] = (tagCount[t] || 0) + 1; }));
  const topTags = Object.keys(tagCount).sort((a, b) => tagCount[b] - tagCount[a]).slice(0, 8);

  let filter = 'All';
  let shown = INITIAL;

  let bar = null;
  if (topTags.length > 1 && projects.length > 1) {
    bar = document.createElement('div');
    bar.className = 'projects-filter';
    bar.innerHTML = ['All', ...topTags].map((t) => `
      <button class="filter-chip${t === 'All' ? ' active' : ''}" type="button" data-filter="${t}">
        ${t}<span class="chip-count">${t === 'All' ? projects.length : tagCount[t]}</span>
      </button>`).join('');
    grid.insertAdjacentElement('beforebegin', bar);
  }

  // ---------- More / Show less button ----------
  const wrap = document.createElement('div');
  wrap.className = 'projects-more';
  wrap.innerHTML = `
    <button class="more-btn" type="button">
      <span class="more-label">More</span>
      <span class="more-arrow">→</span>
    </button>
    <span class="more-count"></span>
  `;
  grid.insertAdjacentElement('afterend', wrap);

  const btn = wrap.querySelector('.more-btn');
  const label = wrap.querySelector('.more-label');
  const count = wrap.querySelector('.more-count');

  const matching = () =>
    cards.filter((c) => filter === 'All' || (projects[Number(c.dataset.index)].tags || []).includes(filter));

  // ---------- Decide what is visible and where the BIG cards go ----------
  function update(animate = true) {
    // remember where the visible cards are now (so they can glide to their new spot)
    const before = new Map();
    cards.forEach((c) => {
      if (!c.classList.contains('is-hidden')) before.set(c, c.getBoundingClientRect());
    });

    const list = matching();
    const visible = list.slice(0, shown);
    const visibleSet = new Set(visible);

    cards.forEach((c) => {
      c.classList.remove('is-feature', 'feature-right');
      c.classList.toggle('is-hidden', !visibleSet.has(c));
    });

    // every 3rd card is a BIG one; the big card switches sides every block
    visible.forEach((c, r) => {
      if (r % 3 === 0) {
        c.classList.add('is-feature');
        if (Math.floor(r / 3) % 2 === 1) c.classList.add('feature-right');
      }
    });

    if (animate) {
      let k = 0;
      visible.forEach((c) => {
        const old = before.get(c);
        const now = c.getBoundingClientRect();
        if (old) {
          const dx = old.left - now.left;
          const dy = old.top - now.top;
          if (dx || dy) {
            gsap.fromTo(c, { x: dx, y: dy }, { x: 0, y: 0, duration: 0.6, ease: 'power3.out', clearProps: 'transform' });
          }
        } else {
          gsap.fromTo(
            c,
            { opacity: 0, y: 40, scale: 0.96 },
            { opacity: 1, y: 0, scale: 1, duration: 0.6, delay: k++ * 0.08, ease: 'power3.out', clearProps: 'opacity,transform' }
          );
        }
      });
    }

    // button
    const all = shown >= list.length;
    wrap.style.display = list.length <= INITIAL ? 'none' : '';
    label.textContent = all ? 'Show less' : 'More';
    btn.classList.toggle('is-less', all);
    count.textContent = `Showing ${Math.min(shown, list.length)} of ${list.length}`;
  }

  btn.addEventListener('click', () => {
    const total = matching().length;
    if (shown >= total) {
      shown = INITIAL;
      update();
      document.querySelector('#projects').scrollIntoView({ behavior: 'smooth' });
    } else {
      shown = Math.min(shown + STEP, total);
      update();
    }
  });

  if (bar) {
    bar.addEventListener('click', (e) => {
      const chip = e.target.closest('.filter-chip');
      if (!chip) return;
      filter = chip.dataset.filter;
      shown = INITIAL;
      bar.querySelectorAll('.filter-chip').forEach((c) => c.classList.toggle('active', c === chip));
      update();
    });
  }

  update(false);

  // card colors from the pictures (the popup reads the same color when it opens)
  applyAutoColors(projects, (i, color) => {
    cards[i].style.setProperty('--card-color', color);
  });

  // ---------- Click a card -> open the detail popup ----------
  grid.addEventListener('click', (e) => {
    if (e.target.closest('a')) return;
    const card = e.target.closest('.project-card');
    if (card) openProject(Number(card.dataset.index));
  });

  grid.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const card = e.target.closest('.project-card');
    if (card) {
      e.preventDefault();
      openProject(Number(card.dataset.index));
    }
  });
}