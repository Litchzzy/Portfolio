import { gsap } from 'gsap';
import { loader } from '../data/loader.js';
import '../loader.css';

// ====== TIMING: when each part starts (seconds). Change these to re-order the animation ======
const T = {
  brackets: 0.1,   // side brackets grow (left from the bottom, right from the top)
  redBars: 0.3,    // the two bars wipe in, then stretch randomly forever
  panel: 0.7,      // the dark panel flickers on
  title: 1.1,      // LOCTH flickers in (then flashes the accent color once)
  bar: 2.1,        // the white loading line flickers in
  progress: 2.3,   // the bar starts filling + the text below flickers in
  box: 2.7,        // top rectangle: single line, then rectangle
  screen: 2.9,     // monitor icon: single line, then rectangle
  typingLeft: 2.7, // top-left text starts typing
  typingRight: 3.1,// top-right text starts typing
  details: 3.3,    // diamonds + stripes flicker in
  hatch: 3.5,      // striped bar above the rectangle flickers in
};
// =============================================================================================

const rand = (a, b) => a + Math.random() * (b - a);

// resolves when the whole page (images included) is loaded, or after 8s so nobody is stuck
const pageLoaded = Promise.race([
  new Promise((res) => {
    if (document.readyState === 'complete') res();
    else window.addEventListener('load', res, { once: true });
  }),
  new Promise((res) => setTimeout(res, 8000)),
]);

// a list of random on/off values that always ends fully visible = a flicker
function blinks(n = 7) {
  const seq = [0];
  for (let i = 0; i < n; i++) seq.push(i % 2 === 0 ? rand(0.7, 1) : rand(0, 0.25));
  seq.push(1);
  return seq;
}

function flickerIn(tl, targets, at, duration = 0.5, n = 7) {
  tl.to(targets, { keyframes: { opacity: blinks(n), easeEach: 'none' }, duration }, at);
}

// the opposite: random on/off values that always end invisible
function flickerOut(tl, targets, at, duration = 0.4, n = 5) {
  const seq = [];
  for (let i = 0; i < n; i++) seq.push(i % 2 === 0 ? rand(0, 0.3) : rand(0.6, 1));
  seq.push(0);
  tl.to(targets, { keyframes: { opacity: seq, easeEach: 'none' }, duration }, at);
}

// types the text letter by letter, with a random speed per letter
function typeText(el, text, ms) {
  el.textContent = '';
  el.classList.add('typing');
  let i = 0;
  (function step() {
    i += 1;
    el.textContent = text.slice(0, i);
    if (i < text.length) setTimeout(step, ms * rand(0.4, 1.6));
    else el.classList.remove('typing');
  })();
}

// a bar that keeps stretching to random lengths
function randomStretch(el, min, max) {
  if (!document.body.contains(el)) return;
  gsap.to(el, {
    width: rand(min, max),
    duration: rand(0.15, 0.7),
    delay: rand(0, 0.25),
    ease: Math.random() < 0.3 ? 'steps(3)' : 'power2.inOut',
    onComplete: () => randomStretch(el, min, max),
  });
}

// a single line appears, then opens up into a rectangle
function formRect(tl, rect, line, at) {
  tl.set(line, { opacity: 1, scaleX: 0 }, at)
    .to(line, { scaleX: 1, duration: 0.3, ease: 'power3.out' }, at)
    .to(line, { keyframes: { opacity: [1, 0.3, 1, 0.5, 1], easeEach: 'none' }, duration: 0.25 }, at + 0.2)
    .set(rect, { opacity: 1, clipPath: 'inset(50% 0 50% 0)' }, at + 0.35)
    .to(rect, { clipPath: 'inset(0% 0 0% 0)', duration: 0.4, ease: 'power2.inOut' }, at + 0.35)
    .to(line, { opacity: 0, duration: 0.15 }, at + 0.7);
}

export function initLoader() {
  if (!loader.enabled) return;

  if (loader.oncePerSession) {
    try {
      if (sessionStorage.getItem('loaderSeen')) return;
      sessionStorage.setItem('loaderSeen', '1');
    } catch {}
  }

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const subs = loader.subtitles && loader.subtitles.length ? loader.subtitles : ['LOADING {percent}%'];

  const el = document.createElement('div');
  el.className = 'ld';
  el.style.setProperty('--ld-accent', loader.accent);
  el.style.setProperty('--ld-scale', loader.scale ?? 0.7);
  el.innerHTML = `
    <div class="ld-grid"></div>

    <div class="ld-stage">
      <p class="ld-note ld-note-left"></p>
      <div class="ld-hatch"></div>
      <div class="ld-box"></div>
      <div class="ld-box-line"></div>
      <p class="ld-note ld-note-right"></p>

      <div class="ld-bracket ld-bracket-l"><i></i></div>
      <div class="ld-bracket ld-bracket-r"></div>

      <div class="ld-panel">
        <div class="ld-panel-bg"></div>

        <div class="ld-screen">
          <div class="ld-screen-box"></div>
          <div class="ld-screen-line"></div>
          <div class="ld-screen-plus"></div>
          <div class="ld-screen-neck"></div>
          <div class="ld-screen-base"></div>
        </div>

        <h2 class="ld-title">${loader.title}</h2>
        <div class="ld-bar"><span class="ld-bar-fill"></span></div>
        <p class="ld-sub"></p>
        <div class="ld-diamonds"><i></i><i></i><i class="red"></i></div>
        <div class="ld-stripes"></div>
      </div>

      <div class="ld-red ld-red-1"></div>
      <div class="ld-red ld-red-2"></div>
    </div>

    <div class="ld-crt"></div>
  `;
  document.body.appendChild(el);
  document.body.classList.add('no-scroll'); // no scrolling while loading

  const $ = (s) => el.querySelector(s);
  const grid = $('.ld-grid');
  const crt = $('.ld-crt');
  const noteL = $('.ld-note-left');
  const noteR = $('.ld-note-right');
  const hatch = $('.ld-hatch');
  const box = $('.ld-box');
  const boxLine = $('.ld-box-line');
  const bracketL = $('.ld-bracket-l');
  const bracketR = $('.ld-bracket-r');
  const tick = $('.ld-bracket-l i');
  const panelBg = $('.ld-panel-bg');
  const screenBox = $('.ld-screen-box');
  const screenLine = $('.ld-screen-line');
  const screenParts = [...el.querySelectorAll('.ld-screen-plus, .ld-screen-neck, .ld-screen-base')];
  const titleEl = $('.ld-title');
  const bar = $('.ld-bar');
  const fill = $('.ld-bar-fill');
  const subEl = $('.ld-sub');
  const diamonds = $('.ld-diamonds');
  const stripes = $('.ld-stripes');
  const red1 = $('.ld-red-1');
  const red2 = $('.ld-red-2');

  // ---------- Everything starts invisible ----------
  gsap.set(
    [noteL, noteR, hatch, box, boxLine, tick, panelBg, screenBox, screenLine, ...screenParts, titleEl, bar, subEl, diamonds, stripes, red1, red2, crt],
    { opacity: 0 }
  );
  gsap.set(bracketL, { scaleY: 0, transformOrigin: '50% 100%' }); // grows from the bottom
  gsap.set(bracketR, { scaleY: 0, transformOrigin: '50% 0%' });   // grows from the top

  // ---------- Progress + changing text under the bar ----------
  const state = { p: 0 };
  let subIdx = -1;
  let template = '';

  function showSub(i) {
    subIdx = i;
    template = subs[i];
    gsap.fromTo(subEl, { opacity: 0 }, { keyframes: { opacity: blinks(5), easeEach: 'none' }, duration: 0.4, overwrite: 'auto' });
  }

  function update() {
    const p = state.p;
    fill.style.transform = `scaleX(${p / 100})`;
    const idx = Math.min(subs.length - 1, Math.floor((p / 100) * subs.length));
    if (idx !== subIdx) showSub(idx);
    subEl.textContent = template.replace('{percent}', String(Math.round(p)).padStart(2, '0'));
  }

  function startProgress() {
    gsap.to(state, {
      p: 100,
      duration: reduce ? 1 : loader.duration,
      ease: 'power1.inOut',
      onUpdate: update,
      onComplete: exit,
    });
  }

  // ---------- Occasional random flicker on parts, so the HUD feels alive ----------
  let idle = null;
  function startIdleFlicker() {
    if (reduce) return;
    const list = [titleEl, subEl, box, screenBox, hatch, noteL, noteR, stripes];
    idle = setInterval(() => {
      if (Math.random() < 0.4) return;
      const t = list[Math.floor(Math.random() * list.length)];
      gsap.fromTo(t, { opacity: rand(0.1, 0.5) }, { opacity: 1, duration: rand(0.08, 0.2), ease: 'steps(2)', overwrite: 'auto' });
    }, 450);
  }

  // ---------- The intro timeline ----------
  const tl = gsap.timeline();

  tl.from(grid, { opacity: 0, duration: 0.8, ease: 'power2.out' }, 0);

  // 1) side brackets grow
  tl.to(bracketL, { scaleY: 1, duration: 0.7, ease: 'power3.out' }, T.brackets)
    .to(bracketR, { scaleY: 1, duration: 0.7, ease: 'power3.out' }, T.brackets + 0.1);
  flickerIn(tl, tick, T.brackets + 0.5, 0.4, 5);

  // 2) bars wipe in, then keep stretching randomly
  tl.set([red1, red2], { opacity: 1 }, T.redBars)
    .fromTo(red1, { width: 0 }, { width: 104, duration: 0.5, ease: 'power3.out' }, T.redBars)
    .fromTo(red2, { width: 0 }, { width: 90, duration: 0.5, ease: 'power3.out' }, T.redBars + 0.12)
    .call(() => {
      if (reduce) return;
      randomStretch(red1, 40, 230);
      randomStretch(red2, 30, 180);
    }, null, T.redBars + 0.7);

  // 3) panel flickers on, then LOCTH flickers in and flashes the accent color once
  flickerIn(tl, panelBg, T.panel, 0.5, 5);
  flickerIn(tl, titleEl, T.title, 0.7, 9);
  tl.to(titleEl, { color: loader.accent, duration: 0.06 }, T.title + 0.8)
    .to(titleEl, { color: '#bdbdbd', duration: 0.5, ease: 'power2.out' }, T.title + 1.1);

  // 4) white loading line, then the bar starts filling + the text below flickers in
  flickerIn(tl, bar, T.bar, 0.4, 5);
  tl.call(startProgress, null, T.progress);

  // 5) top rectangle and monitor icon: single line first, then rectangle
  formRect(tl, box, boxLine, T.box);
  formRect(tl, screenBox, screenLine, T.screen);
  flickerIn(tl, screenParts, T.screen + 0.7, 0.4, 5);

  // 6) corner texts type themselves
  tl.call(() => {
    gsap.set(noteL, { opacity: 1 });
    typeText(noteL, loader.topLeftText || '', loader.typeSpeedLeft);
  }, null, T.typingLeft);
  tl.call(() => {
    gsap.set(noteR, { opacity: 1 });
    typeText(noteR, loader.topRightText || '', loader.typeSpeedRight);
  }, null, T.typingRight);

  // 7) diamonds + stripes flicker in, diamonds keep blinking
  flickerIn(tl, [diamonds, stripes], T.details, 0.5, 7);
  tl.call(() => {
    gsap.to(el.querySelectorAll('.ld-diamonds i'), { opacity: 0.25, duration: 0.6, repeat: -1, yoyo: true, stagger: 0.2 });
  }, null, T.details + 0.5);

  // 8) striped bar above the rectangle: just flickers in (no stretching)
  flickerIn(tl, hatch, T.hatch, 0.55, 7);
  tl.call(startIdleFlicker, null, T.hatch + 0.8);

  if (reduce) tl.timeScale(3);

  // ---------- OUTRO: the HUD flickers and collapses, then the screen shuts off like an old TV ----------
  async function exit() {
    await pageLoaded;
    if (tl.progress() < 1) await new Promise((r) => tl.eventCallback('onComplete', r));
    clearInterval(idle);

    // stop the random stretching, idle flicker and blinking diamonds
    gsap.killTweensOf([
      titleEl, subEl, noteL, noteR, hatch, box, boxLine, screenBox, screenLine, ...screenParts,
      stripes, diamonds, red1, red2, bar, panelBg, bracketL, bracketR, tick,
      ...el.querySelectorAll('.ld-diamonds i'),
    ]);

    
    // ---------- Temporary sci-fi outro effects ----------
    const glitchLayer = document.createElement('div');
    Object.assign(glitchLayer.style, {
      position: 'fixed',
      inset: '0',
      overflow: 'hidden',
      pointerEvents: 'none',
      zIndex: '2147483647'
    });

    
    // Randomized signal corruption fragments
    const glitchBars = Array.from({ length: 36 }, () => {
      const bar = document.createElement('div');

      const width = Math.random() < 0.16
        ? 55 + Math.random() * 45
        : 5 + Math.random() * 42;

      const color = Math.random() < 0.68
        ? '#ffae00'
        : '#ffffff';

      Object.assign(bar.style, {
        position: 'absolute',
        left: `${Math.random() * (100 - width)}%`,
        top: `${5 + Math.random() * 90}%`,
        width: `${width}vw`,
        height: `${Math.random() < 0.25 ? 2 : 1}px`,
        opacity: '0',
        background: color,
        boxShadow: color === '#ffae00'
          ? '0 0 5px rgba(255, 174, 0, 0.65)'
          : '0 0 4px rgba(255, 255, 255, 0.5)',
        transformOrigin: Math.random() < 0.5
          ? 'left center'
          : 'right center',
        willChange: 'transform, opacity'
      });

      glitchLayer.appendChild(bar);
      return bar;
    });

    const scanline = document.createElement('div');
    Object.assign(scanline.style, {
      position: 'absolute',
      left: '0',
      top: '50%',
      width: '100vw',
      height: '3px',
      opacity: '0',
      background: 'linear-gradient(90deg, transparent, #ffffff 15%, #ffffff 85%, transparent)',
      boxShadow: '0 0 8px #ffffff, 0 0 22px #ffae00',
      transform: 'scaleX(1)',
      transformOrigin: 'center center',
      willChange: 'transform, opacity'
    });
    glitchLayer.appendChild(scanline);

    const core = document.createElement('div');
    Object.assign(core.style, {
      position: 'absolute',
      left: '50%',
      top: '50%',
      width: '5px',
      height: '5px',
      borderRadius: '50%',
      opacity: '0',
      background: '#ffffff',
      boxShadow: '0 0 8px 3px #ffffff, 0 0 20px 6px #ffae00',
      transform: 'translate(-50%, -50%)',
      willChange: 'opacity'
    });
    glitchLayer.appendChild(core);

    document.body.appendChild(glitchLayer);

    
    const out = gsap.timeline({
      onComplete: () => {
        glitchLayer.remove();
        el.remove();
        document.body.classList.remove('no-scroll');
      },
    });

    // 1) texts, details and icon parts flicker out
    flickerOut(out, [titleEl, subEl], 0, 0.45, 7);
    flickerOut(out, [noteL, noteR], 0.05, 0.4, 5);
    flickerOut(out, [hatch, stripes, diamonds], 0.1, 0.4, 5);
    flickerOut(out, screenParts, 0.15, 0.35, 5);

    // 2) the white loading line shrinks away to the right
    out.to(bar, { scaleX: 0, transformOrigin: 'right center', duration: 0.5, ease: 'power3.in' }, 0.2);

    // 3) rectangle and monitor collapse back into a single line, then the line disappears
    out.fromTo(box, { clipPath: 'inset(0% 0% 0% 0%)' }, { clipPath: 'inset(50% 0% 50% 0%)', duration: 0.3, ease: 'power2.in' }, 0.3)
      .set(boxLine, { opacity: 1, scaleX: 1 }, 0.6)
      .to(boxLine, { scaleX: 0, duration: 0.25, ease: 'power2.in' }, 0.6)
      .fromTo(screenBox, { clipPath: 'inset(0% 0% 0% 0%)' }, { clipPath: 'inset(50% 0% 50% 0%)', duration: 0.3, ease: 'power2.in' }, 0.35)
      .set(screenLine, { opacity: 1, scaleX: 1 }, 0.65)
      .to(screenLine, { scaleX: 0, duration: 0.25, ease: 'power2.in' }, 0.65);

    // 4) brackets shrink (left toward the top, right toward the bottom), bars retract, panel squeezes into a line
    out.set(bracketL, { transformOrigin: '50% 0%' }, 0.5)
      .set(bracketR, { transformOrigin: '50% 100%' }, 0.5)
      .to([bracketL, bracketR], { scaleY: 0, duration: 0.45, ease: 'power3.in' }, 0.5)
      .to(tick, { opacity: 0, duration: 0.2 }, 0.5)
      .to([red1, red2], { width: 0, duration: 0.4, ease: 'power3.in' }, 0.5)
      .fromTo(panelBg, { clipPath: 'inset(0% 0% 0% 0%)' }, { clipPath: 'inset(50% 0% 50% 0%)', duration: 0.4, ease: 'power3.in' }, 0.6);


    
    // 5) TACTICAL SHUTDOWN + DIGITAL GLITCH + CRT CUTOFF


    // Phase A: randomized signal corruption burst
    out.to(grid, {
      opacity: 0,
      duration: 0.2,
      ease: 'power1.out'
    }, 0.8);

    // Each fragment gets its own timing, displacement and intensity.
    glitchBars.forEach((bar) => {
      const start = 0.81 + Math.random() * 0.43;
      const duration = 0.035 + Math.random() * 0.075;

      const offsetX = rand(-34, 34);
      const offsetY = rand(-3, 3);
      const peakOpacity = rand(0.45, 1);
      const peakScale = rand(0.2, 1.15);

      out.fromTo(bar, {
        opacity: 0,
        x: offsetX,
        y: offsetY,
        scaleX: 0
      }, {
        opacity: peakOpacity,
        x: offsetX + rand(-18, 18),
        y: offsetY + rand(-2, 2),
        scaleX: peakScale,
        duration,
        ease: 'steps(2)',
        yoyo: true,
        repeat: 1
      }, start);
    });

    
    // Secondary burst: rapid, denser signal breakup
    for (let i = 0; i < 14; i++) {
      const target = glitchBars[
        Math.floor(Math.random() * glitchBars.length)
      ];

      const start = 1.02 + Math.random() * 0.22;

      out.to(target, {
        opacity: rand(0.35, 1),
        x: rand(-40, 40),
        scaleX: rand(0.15, 1),
        duration: rand(0.025, 0.055),
        ease: 'steps(2)',
        repeat: 1,
        yoyo: true
      }, start);
    }


    out.to(glitchBars[0], {
      opacity: 0.9,
      scaleX: 0.68,
      x: 0,
      duration: 0.07,
      ease: 'steps(2)'
    }, 0.82)
      .to(glitchBars[0], {
        x: -18,
        opacity: 0,
        duration: 0.08,
        ease: 'steps(2)'
      })
      .fromTo(glitchBars[1],
        { opacity: 0, scaleX: 1, x: 0 },
        {
          opacity: 1,
          scaleX: 0.45,
          x: 12,
          duration: 0.06,
          ease: 'steps(2)'
        }, 0.88)
      .to(glitchBars[1], {
        opacity: 0,
        x: -8,
        duration: 0.07,
        ease: 'steps(2)'
      })
      .fromTo(glitchBars[2],
        { opacity: 0, scaleX: 1, x: 0 },
        {
          opacity: 0.8,
          scaleX: 0.32,
          x: -10,
          duration: 0.06,
          ease: 'steps(2)'
        }, 0.94)
      .to(glitchBars[2], {
        opacity: 0,
        x: 14,
        duration: 0.08,
        ease: 'steps(2)'
      })
      .fromTo(glitchBars[3],
        { opacity: 0, scaleX: 1, x: 0 },
        {
          opacity: 0.65,
          scaleX: 0.2,
          x: 20,
          duration: 0.05,
          ease: 'steps(2)'
        }, 0.99)
      .to(glitchBars[3], {
        opacity: 0,
        duration: 0.08
      });

    // Phase B: final brightness pulse
    out.to(el, {
      opacity: 0.72,
      duration: 0.05,
      ease: 'steps(2)'
    }, 1.08)
      .to(el, {
        opacity: 1,
        duration: 0.06,
        ease: 'steps(2)'
      });

    // Phase C: CRT scanline appears across the screen
    out.to(scanline, {
      opacity: 1,
      scaleX: 1,
      duration: 0.07,
      ease: 'power2.out'
    }, 1.18);

    // The image collapses vertically into a bright horizontal line.
    // Use the dedicated scanline instead of clipping the entire loader.
    out.to(el, {
      opacity: 0,
      duration: 0.1,
      ease: 'power1.in'
    }, 1.24);

    out.to(scanline, {
      opacity: 0.95,
      scaleX: 0.035,
      duration: 0.22,
      ease: 'power3.in'
    }, 1.25);

    // Phase D: the last point of light disappears
    out.to(scanline, {
      opacity: 0,
      duration: 0.07,
      ease: 'power2.in'
    }, 1.47);

    out.to(core, {
      opacity: 1,
      duration: 0.045,
      ease: 'steps(2)'
    }, 1.47)
      .to(core, {
        opacity: 0,
        duration: 0.12,
        ease: 'power2.out'
      }, 1.54);


    if (reduce) out.timeScale(2);
  }
}