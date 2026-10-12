import { gsap } from 'gsap';
import { about } from '../data/about.js';
import '../about.css';
import '../lightTheme.css'; // light-theme colors (always loaded together with the About section)

export function initAbout() {
  const root = document.querySelector('#aboutRoot');
  if (!root) return;

  const side = about.photoSide === 'right' ? 'right' : 'left';
  const initial = (about.name || 'A').charAt(0);

  // each block appears a little after the previous one
  let step = 0;
  const delay = () => `${(step++ * 0.08).toFixed(2)}s`;

  const paragraphs = (about.bio || '')
    .split(/\n+/)
    .filter(Boolean)
    .map((t) => `<p>${t}</p>`)
    .join('');

  // the strip of tools repeats so it can loop forever without a gap
  const tools = about.tools || [];
  const reps = tools.length ? Math.ceil(10 / tools.length) : 0;
  const half = Array.from({ length: reps }, () => tools).flat();
  const marqueeItems = [...half, ...half].map((t) => `<span class="ab-tool">${t}</span>`).join('');

  root.innerHTML = `
    <div class="ab-card ab-${side}">
      <div class="ab-glow ab-glow-1"></div>
      <div class="ab-glow ab-glow-2"></div>

      <div class="ab-photo">
        <div class="ab-photo-img">
          <div class="ab-photo-fallback">${initial}</div>
          ${about.photo ? `<img src="${about.photo}" alt="${about.name}" draggable="false" />` : ''}
        </div>
        ${
          about.available
            ? `<div class="ab-badge"><span class="ab-badge-dot"></span>${about.availableText || 'Available'}</div>`
            : ''
        }
      </div>

      <div class="ab-content">
        <span class="ab-kicker ab-reveal" style="--d:${delay()}">About me</span>

        <h2 class="ab-title ab-reveal" style="--d:${delay()}">
          Hi, I'm <span class="ab-name">${about.name}</span><br />
          I'm a <span class="ab-role"></span>
        </h2>

        <div class="ab-bio ab-reveal" style="--d:${delay()}">${paragraphs}</div>

        ${
          (about.stats || []).length
            ? `<div class="ab-stats ab-reveal" style="--d:${delay()}">
                ${about.stats
                  .map(
                    (s) => `
                  <div class="ab-stat">
                    <div class="ab-stat-num" data-value="${s.value}" data-suffix="${s.suffix || ''}">0${s.suffix || ''}</div>
                    <div class="ab-stat-label">${s.label}</div>
                  </div>`
                  )
                  .join('')}
              </div>`
            : ''
        }

        ${
          (about.skills || []).length
            ? `<div class="ab-reveal" style="--d:${delay()}">
                <div class="ab-label">Skills</div>
                <div class="ab-skills">
                  ${about.skills
                    .map(
                      (s, k) => `
                    <div class="ab-skill" style="--lvl:${s.level}%; --k:${k}">
                      <div class="ab-skill-top"><span>${s.name}</span><span>${s.level}%</span></div>
                      <div class="ab-bar"><div class="ab-bar-fill"></div></div>
                    </div>`
                    )
                    .join('')}
                </div>
              </div>`
            : ''
        }

        ${
          (about.facts || []).length
            ? `<div class="ab-facts ab-reveal" style="--d:${delay()}">
                ${about.facts.map((f) => `<span class="ab-fact"><span>${f.icon}</span>${f.text}</span>`).join('')}
              </div>`
            : ''
        }

        <div class="ab-actions ab-reveal" style="--d:${delay()}">
          <a class="ab-btn ab-btn-primary" href="#contact">Let's talk <span>→</span></a>
          ${about.cv ? `<a class="ab-btn ab-btn-ghost" href="${about.cv}" download>Download CV</a>` : ''}
        </div>
      </div>
    </div>

    ${
      tools.length
        ? `<div class="ab-marquee"><div class="ab-marquee-track">${marqueeItems}</div></div>`
        : ''
    }
  `;

  const card = root.querySelector('.ab-card');

  // ---------- Typing effect for the role ----------
  const roleEl = root.querySelector('.ab-role');
  const roles = about.roles && about.roles.length ? about.roles : ['Developer'];
  let r = 0;
  let c = 0;
  let deleting = false;

  function type() {
    const word = roles[r];
    c += deleting ? -1 : 1;
    roleEl.textContent = word.slice(0, c);

    let wait = deleting ? 45 : 90;
    if (!deleting && c === word.length) {
      wait = 1400;
      deleting = true;
    } else if (deleting && c === 0) {
      deleting = false;
      r = (r + 1) % roles.length;
      wait = 350;
    }
    setTimeout(type, wait);
  }
  type();

  // ---------- Numbers count up ----------
  const nums = [...root.querySelectorAll('.ab-stat-num')];

  function countUp() {
    nums.forEach((el, k) => {
      const end = Number(el.dataset.value);
      const suffix = el.dataset.suffix;
      el._o = el._o || { v: 0 };
      gsap.killTweensOf(el._o);
      el._o.v = 0;
      gsap.to(el._o, {
        v: end,
        duration: 1.8,
        delay: 0.5 + k * 0.12,
        ease: 'power2.out',
        onUpdate: () => { el.textContent = Math.round(el._o.v) + suffix; },
      });
    });
  }

  function resetCount() {
    nums.forEach((el) => {
      if (el._o) gsap.killTweensOf(el._o);
      el.textContent = '0' + el.dataset.suffix;
    });
  }

  // ---------- Reveal on scroll (plays when it appears, rewinds when it leaves) ----------
  new IntersectionObserver(
    ([entry]) => {
      card.classList.toggle('visible', entry.isIntersecting);
      if (entry.isIntersecting) countUp();
      else resetCount();
    },
    { threshold: 0.1 }
  ).observe(card);

  // ---------- Photo follows the mouse a little ----------
  const photo = root.querySelector('.ab-photo');
  const photoImg = photo.querySelector('img');

  if (photoImg) {
    // if the photo file is missing, the big letter behind it stays visible
    photoImg.addEventListener('error', () => photoImg.remove());

    photo.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const rect = photo.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      photoImg.style.transform = `translate(${-x * 18}px, ${-y * 18}px) scale(1.08)`;
    });

    photo.addEventListener('pointerleave', () => {
      photoImg.style.transform = '';
    });
  }

  // ---------- "Let's talk" scrolls smoothly to Contact ----------
  root.querySelector('a[href="#contact"]').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
  });
}