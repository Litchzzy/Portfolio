import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { camera, rocket } from './scene.js';

gsap.registerPlugin(ScrollTrigger);

export function initHeroTimeline() {
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: '#hero',
      start: 'top top',
      end: 'bottom top',
      scrub: 1,
      // markers: true, // uncomment while testing to see where the trigger starts/ends
    },
  });

  // --- Phase 1 (first half of hero scroll): camera moves from Camera 1 to Camera 2 ---
  tl.to(camera.position, {
    x: 1.5,
    y: 0.3,
    z: 2.2,
    duration: 1,
  }, 0); // "0" = starts at the very beginning of this timeline

  // --- Phase 2 (second half of hero scroll): rocket launches ---
  tl.to(rocket.position, {
    y: 2.5,
    duration: 1,
  }, 0.6) // "0.6" = starts 60% through the timeline — i.e. after the camera move is mostly done
    .to(rocket.rotation, {
      z: 0.15,
      duration: 1,
    }, 0.6); // same start point, runs in parallel with the position tween
}


