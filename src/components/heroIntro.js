import { gsap } from 'gsap';
import { siteReady } from '../utils/ready.js';

export function initHeroIntro(carousel) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  if (!carousel || !carousel.layout || !carousel.intro) {
    console.warn('[heroIntro] initHeroCarousel() returned nothing. Check the last lines of heroCarousel.js: it must end with  layout();  return { layout, intro };');
  }

  const title = document.querySelector('#hero .hero-title');
  const desc = document.querySelector('#hero .hero-desc');
  const carouselEl = document.querySelector('#heroCarousel');
  const bgs = document.querySelectorAll('#hero .hero-bg');
  const navItems = [...document.querySelectorAll('#navbar .nav-logo, #navbar .nav-link, #navbar .hamburger')];
  const dots = document.querySelector('.scroll-dots');
  const intro = carousel && carousel.intro;
  const layout = carousel && carousel.layout;

  // split "Locth" into letters so each one can animate
  let chars = [];
  if (title) {
    const text = title.textContent.trim();
    title.setAttribute('aria-label', text);
    title.innerHTML = [...text]
      .map((ch) => `<span class="hi-char" aria-hidden="true" style="display:inline-block">${ch === ' ' ? '&nbsp;' : ch}</span>`)
      .join('');
    chars = [...title.querySelectorAll('.hi-char')];
  }

  // remember the normal opacity of the nav items, then hide everything (the loading screen is covering it anyway)
  const navTargets = navItems.map((el) => parseFloat(getComputedStyle(el).opacity) || 1);
  gsap.set(chars, { yPercent: 90, opacity: 0, filter: 'blur(10px)' });
  if (desc) gsap.set(desc, { y: 24, opacity: 0, filter: 'blur(6px)' });
  if (carouselEl) gsap.set(carouselEl, { opacity: 0, x: 140, filter: 'blur(12px)' });
  gsap.set(bgs, { scale: 1.15 });
  gsap.set(navItems, { opacity: 0, y: -14 });
  if (dots) gsap.set(dots, { opacity: 0 });
  if (intro && layout) { intro.spread = 0; layout(); }

  siteReady.then(play);

  function play() {
    navItems.forEach((el) => { el.style.transition = 'none'; });

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.to(bgs, { scale: 1, duration: 2.6, ease: 'power2.out' }, 0)

      // text side
      .to(chars, { yPercent: 0, opacity: 1, filter: 'blur(0px)', duration: 1.0, stagger: 0.09 }, 0.15)
      .to(desc, { y: 0, opacity: 1, filter: 'blur(0px)', duration: 1.1 }, 0.95)

      // carousel side (starts later and moves differently on purpose)
      .to(carouselEl, { opacity: 1, x: 0, filter: 'blur(0px)', duration: 1.5, ease: 'power4.out' }, 0.55);

    if (intro && layout) {
      tl.to(intro, {
        spread: 1, duration: 1.6, ease: 'back.out(1.3)',
        onUpdate: () => layout(),
        onComplete: () => layout(),
      }, 0.8);
    }

    tl.to(navItems, {
        opacity: (i) => navTargets[i], y: 0, duration: 0.7, stagger: 0.06,
        onComplete: () => navItems.forEach((el) => { el.style.transition = ''; el.style.opacity = ''; el.style.transform = ''; }),
      }, 1.0);

    if (dots) tl.to(dots, { opacity: 1, duration: 0.8 }, 1.6);

    // blur filters are only needed during the animation
    tl.add(() => gsap.set([chars, desc, carouselEl], { clearProps: 'filter' }));
  }
}