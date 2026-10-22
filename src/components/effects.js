import '../effects.css';

export function initEffects() {
  initScrollDots();
  initCardTilt();
}

// ---------- Vertical dots (one per section) ----------
function initScrollDots() {
  const sections = [...document.querySelectorAll('.panel')].filter((s) => s.id);
  if (!sections.length) return;

  // names shown when you hover a dot (change them here)
  const labels = { hero: 'Home', core: 'Core', about: 'About', journey: 'Journey', projects: 'Projects', contact: 'Contact' };
  const labelOf = (id) => labels[id] || id;

  const nav = document.createElement('nav');
  nav.className = 'scroll-dots';
  nav.setAttribute('aria-label', 'Page sections');
  nav.innerHTML = sections
    .map(
      (s) => `<button class="scroll-dot" type="button"
                data-target="${s.id}" data-label="${labelOf(s.id)}"
                aria-label="Go to ${labelOf(s.id)}"></button>`
    )
    .join('');
  document.body.appendChild(nav);

  const dots = [...nav.querySelectorAll('.scroll-dot')];

  // click a dot -> smooth scroll to that section
  nav.addEventListener('click', (e) => {
    const dot = e.target.closest('.scroll-dot');
    if (!dot) return;
    document.getElementById(dot.dataset.target)?.scrollIntoView({ behavior: 'smooth' });
  });

  // highlight the section you are currently in
  let ticking = false;

  function update() {
    ticking = false;
    let current = sections[0].id;
    sections.forEach((s) => {
      if (s.getBoundingClientRect().top <= window.innerHeight * 0.5) current = s.id;
    });
    dots.forEach((d) => d.classList.toggle('active', d.dataset.target === current));
  }

  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    },
    { passive: true }
  );
  window.addEventListener('resize', update);
  update();
}

// ---------- Project cards: tilt toward the mouse + light that follows it ----------
function initCardTilt() {
  const grid = document.querySelector('#projectsGrid');
  if (!grid) return;

  const MAX_TILT = 12; // degrees, change for a stronger/weaker tilt
  let frame = null;

  grid.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return; // no tilt on touch screens
    const card = e.target.closest('.project-card');
    if (!card) return;

    if (frame) cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      card.style.setProperty('--mx', `${x}px`);
      card.style.setProperty('--my', `${y}px`);
      card.style.setProperty('--ry', `${(x / rect.width - 0.5) * MAX_TILT * 2}deg`);
      card.style.setProperty('--rx', `${(0.5 - y / rect.height) * MAX_TILT * 2}deg`);
    });
  });

  // mouse leaves the card -> straighten it again
  grid.addEventListener('pointerout', (e) => {
    const card = e.target.closest('.project-card');
    if (card && !card.contains(e.relatedTarget)) {
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
    }
  });
}