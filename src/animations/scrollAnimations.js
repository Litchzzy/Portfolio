import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { torus, material } from '../three/scene.js';

gsap.registerPlugin(ScrollTrigger);

export function initScrollAnimations() {
  // Torus rotation tied to full-page scroll
  gsap.to(torus.rotation, {
    y: Math.PI * 4,
    x: Math.PI * 2,
    scrollTrigger: {
      trigger: '#app',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1,
    },
  });

  // Text fade/slide per section
  const sections = gsap.utils.toArray('.panel');

sections.forEach((section) => {
    const elements = gsap.utils
      .toArray(section.querySelectorAll('h1, h2, p'))
      .filter((el) => !el.closest('.project-card')); // skip text inside cards, handled separately below
    gsap.set(elements, { opacity: 0, y: 60 }); // set starting state in JS, not just CSS

    gsap.to(elements, {
      opacity: 1,
      y: 0,
      duration: 1,
      stagger: 0.15,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: section,
        start: 'top 85%',
        end: 'top 40%',
        scrub: 1,
      },
    });
  });

    // Project card reveal
  const cards = gsap.utils.toArray('.project-card');
  if (cards.length) {
    gsap.set(cards, { opacity: 0, y: 60 });
    gsap.to(cards, {
      opacity: 1,
      y: 0,
      duration: 0.9,
      stagger: 0.15,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '#projects',
        start: 'top 70%',
        end: 'top 20%',
        scrub: 1,
      },
    });
  }
  
  // Torus color change per section
  const sectionColors = {
    hero: 0x00ffff,
    about: 0xff00ff,
    projects: 0xffaa00,
    contact: 0x00ff88,
  };

  sections.forEach((section) => {
    const color = sectionColors[section.id];
    if (!color) return;

    const setColor = () =>
      gsap.to(material.color, {
        r: ((color >> 16) & 255) / 255,
        g: ((color >> 8) & 255) / 255,
        b: (color & 255) / 255,
        duration: 0.6,
      });

    ScrollTrigger.create({
      trigger: section,
      start: 'top center',
      end: 'bottom center',
      onEnter: setColor,
      onEnterBack: setColor,
    });
  });

  window.addEventListener('load', () => ScrollTrigger.refresh());
}