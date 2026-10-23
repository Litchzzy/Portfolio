import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import modelUrl from '../data/Models/Locth_Core_GLTF_Parented.glb?url';
import '../core.css';

gsap.registerPlugin(ScrollTrigger);

/* =====================================================
   1) TIMING
   ===================================================== */
const SCROLL_LENGTH = '+=600%'; // total scroll distance while pinned (bigger = slower)
const PHASE = {
  disassembleEnd: 0.4, // scroll 0   -> 0.4  : parts fly apart
  holdEnd: 0.62,       // scroll 0.4 -> 0.62 : hold
                       // scroll 0.62 -> 1   : parts come back together
};
const SPREAD = 0.85;   // multiplies EVERY distance below: 0.7 = tighter, 1.3 = wider
const EASE_MIX = 0.3;  // 0 = linear scrub, 1 = strongly eased start/stop
const DAMP = 5;        // scroll smoothing (lower = floatier, higher = snappier)

/* =====================================================
   2) HOW EACH PART MOVES   (the "animation", edit freely)
   TOTAL = length of the timeline in "seconds". Each segment says:
     t0 / t1  = when it starts / ends moving
     move     = [x, y, z] distance in WORLD directions (children of a part follow their parent automatically)
     radial   = distance straight outward from the center axis
     spin     = degrees turned around the part's own Y while moving (360 = back to the same look)
   A part can have several segments (they add up). Names have spaces -> "_" and dots are removed.
   First matching rule wins. Parts with no rule (Core, EngineRectangleLine...) stay put.
   ===================================================== */
const TOTAL = 13;
const RULES = [
  // the two big plates leave first, far along their own corner
  { match: /^OuterLayerPieceCap1/, segs: [{ t0: 0.2, t1: 1.2, move: [-1.5, -0.5, 1.5] }] },
  { match: /^OuterLayerPieceCap2/, segs: [{ t0: 0.2, t1: 1.2, move: [1.5, -0.5, -1.5] }] },
  { match: /^OuterLayer$/,        segs: [{ t0: 0.75, t1: 2.2, move: [0, -3.2, 0] }] },
  // the upper shell takes the screen with it
  { match: /^OuterLayerNUp/,      segs: [{ t0: 2.1, t1: 3.0, move: [0, 2.75, 0] }] },
  { match: /^Screen/,             segs: [{ t0: 2.1, t1: 3.0, move: [0, 2.75, 0] }] },
  { match: /^OuterLayerNDown/,    segs: [{ t0: 2.1, t1: 3.0, move: [0, -3.0, 0] }] },

  // bolts unscrew, then their holders follow
  { match: /^Bolt1/,       segs: [{ t0: 2.4, t1: 4.0, move: [0, 2.4, 0], spin: 360 }] },
  { match: /^Bolt2/,       segs: [{ t0: 2.4, t1: 4.0, move: [0, -2.25, 0], spin: -360 }] },
  { match: /^BoltHolder1/, segs: [{ t0: 3.2, t1: 5.0, move: [0, 2.0, 0] }] },
  { match: /^BoltHolder2/, segs: [{ t0: 3.2, t1: 5.0, move: [0, -1.75, 0] }] },

  // data rings: the top one leaves first, they separate one by one
  { match: /^DataCap/, segs: [{ t0: 5.7, t1: 7.4, move: [0, 1.60, 0] }] },
  { match: /^Data4/,   segs: [{ t0: 6.0, t1: 7.7, move: [0, 1.40, 0] }] },
  { match: /^Data3/,   segs: [{ t0: 6.3, t1: 8.0, move: [0, 1.20, 0] }] },
  { match: /^Data2/,   segs: [{ t0: 6.6, t1: 8.3, move: [0, 1.00, 0] }] },
  { match: /^Data1/,   segs: [{ t0: 6.9, t1: 8.6, move: [0, 0.8, 0] }] },

  // engine: cubes slide out of their rails, then the whole engine (rails + cubes) drops
  // Engine cubes stay in their original local positions and follow EngineHolder.
  // every cube moves randomly up/down, limited by the EngineRectangleLine (auto-measured)
  { match: /^EngineCube/, segs: [] },
  { match: /^EngineHolder/, segs: [{ t0: 6.0, t1: 8.6, move: [0, -1.25, 0] }] },

  // each leg swings outward along its own diagonal, hinged at its top.
  // swing > 0 = bottom end goes OUT. Wrong way? use a negative number, or change pivot.
  // pivot: 'top' | 'bottom' | 'center'
  { match: /^Legs1/, pivot: 'origin', segs: [{ t0: 8.8, t1: 9.6, open: 55 }] },
  { match: /^Legs2/, pivot: 'origin', segs: [{ t0: 8.8, t1: 9.6, open: 55 }] },
  { match: /^Legs3/, pivot: 'origin', segs: [{ t0: 8.8, t1: 9.6, open: 55 }] },
  { match: /^Legs4/, pivot: 'origin', segs: [{ t0: 8.8, t1: 9.6, open: 55 }] },
  { match: /^LegHolderCap/, segs: [{ t0: 8.8, t1: 9.8, move: [0, 0.65, 0] }] },
  // the cap above the core lifts off last, after the corner pieces are gone
  { match: /^LegsHolder/, segs: [{ t0: 10.6, t1: 11.6, move: [0, -0.6, 0] }] },
  
  // the four corner pieces open up: sideways first, THEN up/down (so they never touch the cap or plates)
    { match: /^OuterCore_Piece_1/, segs: [{ t0: 11.7, t1: 13, move: [-1.1, -0.8,  1.1] }] },
  { match: /^OuterCore_Piece_2/, segs: [{ t0: 11.7, t1: 13, move: [-1.1,  0.8, -1.1] }] },
  { match: /^OuterCore_Piece_3/, segs: [{ t0: 11.7, t1: 13, move: [ 1.1,  0.8,  1.1] }] },
  { match: /^OuterCore_Piece_4/, segs: [{ t0: 11.7, t1: 13, move: [ 1.1, -0.8, -1.1] }] },
];

/* =====================================================
   3) CAMERA PATH  (p = scroll progress 0..1)
   azim = turn around the model (deg), elev = height angle (90 = straight down),
   dist = distance, ty = where it looks (up/down), roll = tilt (deg)
   ===================================================== */
const CAMERA_PATH = [
  { p: 0.0,  azim: 0,   elev: 84,  dist: 7,    ty: 0,    roll: 0,  fov: 35 },
  { p: 0.12, azim: 35,  elev: 55,  dist: 8.5,  ty: -0.1, roll: -4 },
  { p: 0.26, azim: 60,  elev: 26,  dist: 12,   ty: -0.2, roll: -8 },
  { p: 0.4,  azim: 75,  elev: 16,  dist: 14,   ty: -0.2, roll: -6 },
  { p: 0.62, azim: 105, elev: 8,   dist: 13.5, ty: -0.2, roll: 3 },
  { p: 0.78, azim: 150, elev: -28, dist: 10.5, ty: -0.1, roll: 8 },
  { p: 0.92, azim: 200, elev: -62, dist: 8,    ty: 0,    roll: 4 },
  { p: 1.0,  azim: 225, elev: -84, dist: 6.5,  ty: 0,    roll: 0 },
];
const CAMERA_SHAKE = 1; // tiny handheld drift in degrees (0 = off)

/* =====================================================
   4) IDLE ANIMATION
   Each item starts playing when its `trigger` part (default: the part itself)
   is IDLE_START (80%) of the way out. It stops again when that part goes back in.
   type 'step'   : rotate `deg` over `turn` s, rest `wait` s, repeat
   type 'wobble' : gentle back-and-forth rotation (amp = degrees on x, y, z)
   type 'hover'  : floats up and down (amp = distance)
   type 'random' : (core) turns to a random small angle every few seconds + tiny hover
   Parented parts (legs, engine cubes) follow their holder, so rotating the holder moves them too.
   ===================================================== */
const IDLE_START = 0.8;
const IDLE = [
  // bolts + bolt holders: 45 degrees, rest 1 second, repeat
  { part: 'Bolt1',        type: 'step', axis: 'y', deg: 45, turn: 0.6, wait: 1.0, dir: 1,  delay: 0 },
  { part: 'BoltHolder1',  type: 'step', axis: 'y', deg: 45, turn: 0.6, wait: 1.0, dir: -1, delay: 0.3 },
  { part: 'Bolt2',        type: 'step', axis: 'y', deg: 45, turn: 0.6, wait: 1.0, dir: -1, delay: 0.15 },
  { part: 'BoltHolder2',  type: 'step', axis: 'y', deg: 45, turn: 0.6, wait: 1.0, dir: 1,  delay: 0.45 },

  // data rings
  { part: 'DataCap', type: 'step', axis: 'y', deg: 90, turn: 1.0, wait: 2.0, dir: 1,  delay: 0.2 },
  { part: 'Data4',   type: 'step', axis: 'y', deg: 45, turn: 0.8, wait: 1.5, dir: -1, delay: 0.4 },
  { part: 'Data3',   type: 'step', axis: 'y', deg: 45, turn: 0.8, wait: 1.5, dir: 1,  delay: 0.6 },
  { part: 'Data2',   type: 'step', axis: 'y', deg: 45, turn: 0.8, wait: 1.5, dir: -1, delay: 0.8 },
  { part: 'Data1',   type: 'step', axis: 'y', deg: 45, turn: 0.8, wait: 1.5, dir: 1,  delay: 1.0 },

  // engine and legs holder turn (their cubes / legs ride along)
  { part: 'EngineHolder', type: 'step', axis: 'y', deg: 45, turn: 0.9, wait: 1.5, dir: 1,  delay: 0.2 },
  { part: 'LegsHolder',   type: 'step', axis: 'y', deg: 45, turn: 0.9, wait: 1.5, dir: -1, delay: 0.5 },

  // Engine cubes bob independently while their parent EngineHolder moves.
  { match: /^EngineCube/, trigger: 'EngineHolder', type: 'randomHover', amp: 0.045, every: [0.5, 1.4], smooth: 4 },

  // big pieces drift a little
  { part: 'OuterLayerPieceCap1', type: 'wobble', amp: [5, 8, 5], speed: 0.8, phase: 0 },
  { part: 'OuterLayerPieceCap2', type: 'wobble', amp: [5, 8, 5], speed: 0.8, phase: 2 },
  { part: 'OuterCore_Piece_1', type: 'wobble', amp: [8, 8, 8], speed: 0.6, phase: 0 },
  { part: 'OuterCore_Piece_2', type: 'wobble', amp: [8, 8, 8], speed: 0.6, phase: 1.5 },
  { part: 'OuterCore_Piece_3', type: 'wobble', amp: [8, 8, 8], speed: 0.6, phase: 3 },
  { part: 'OuterCore_Piece_4', type: 'wobble', amp: [8, 8, 8], speed: 0.6, phase: 4.5 },
  // shell and screen hover with the SAME numbers so the screen never drifts off its shell
  { part: 'OuterLayerNUp',   type: 'hover', amp: 0.06, speed: 0.7, phase: 0 },
  { part: 'Screen',          type: 'hover', amp: 0.06, speed: 0.7, phase: 0 },
  { part: 'OuterLayerNDown', type: 'hover', amp: 0.06, speed: 0.7, phase: 2 },

  // the core starts as soon as its shell pieces are gone (calm hover, small random turns)
    // core never stops: continuous tumble in degrees per second [x, y, z]
  { part: 'Core', trigger: 'OuterCore_Piece_1', type: 'spin', speed: [14, 40, 9], hover: 0.025, hoverSpeed: 0.9 },
];

/* =====================================================
   5) NEON CORE + BLOOM + LENS FLARE
   ===================================================== */
const CORE = { color: '#ffbb00', intensity: 1.6 };               // intensity above 1 = it blooms
const BLOOM = { strength: 0.7, radius: 0.5, threshold: 1.0 };    // threshold 1.0 = only the core glows
const FLARE = {
  color: '#ffbb00',
  intensity: 0.5,    // 0 = off
  glowSize: 320,     // px, soft glow around the core
  streakWidth: 700,  // px, thin horizontal streak (set 0 to remove it)
  streakHeight: 4,
};

/* =====================================================
   5b) THE SCREEN (the display on top of the barrel)
   ===================================================== */
const SCREEN = {
  pattern: 'cube',   // 'cube' (isometric cube made of dots) or 'heart'
  colors: ['#ff3d4a', '#ffbb00', '#2de2a6', '#2b98f1'], // the 4 colors of the outer ring
  dot: '#ffbb00',    // color of the dot picture
  gain: 1.0,         // above ~1.2 the bright parts start to bloom
  rotation: 0,       // 0 / 90 / 180 / 270: turn the picture if it looks sideways
  mirror: false,     // true = flip it left/right
};

/* =====================================================
   6) LOOK of the other parts (switches with dark/light theme)
   ===================================================== */
const EDGE_LINES = true;
const HULL_OUTLINE = false;
const HULL_THICKNESS = 0.02;
const COLORS = {
  dark:  { base: '#2b2b30', rim: '#ffae00', accent: '#ffae00', line: '#ffffff', hull: '#ffae00' },
  light: { base: '#e9e7e2', rim: '#ff6434', accent: '#ff6434', line: '#111111', hull: '#111111' },
};

/* =====================================================
   7) LEADER LINES + TEXT   (part = name of the part, y = 0 top .. 1 bottom)
   ===================================================== */
const LABELS = [
  { text: 'Screen',          part: 'Screen',          side: 'right', y: 0.1 },
  { text: 'Outer Shell [N]', part: 'OuterLayerNUp',   side: 'right', y: 0.2 },
  { text: 'Bolt',            part: 'Bolt1',           side: 'right', y: 0.3 },
  { text: 'Data Cap',        part: 'DataCap',         side: 'right', y: 0.4 },
  { text: 'Core',            part: 'Core',            side: 'right', y: 0.5 },
  { text: 'Engine Holder',   part: 'EngineHolder',    side: 'left',  y: 0.6 },
  { text: 'Legs Holder',     part: 'LegsHolder',      side: 'left',  y: 0.7 },
  { text: 'Outer Layer [N]', part: 'OuterLayer',      side: 'left',  y: 0.8 },
  { text: 'Outer Shell [N]', part: 'OuterLayerNDown', side: 'left',  y: 0.9 },
];

/* =====================================================
   SHADERS  (output LINEAR color, the OutputPass converts it at the end)
   ===================================================== */
const VERT = /* glsl */ `
  varying vec3 vN;
  varying vec3 vV;
  varying vec3 vW;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vN = normalize(normalMatrix * normal);
    vV = normalize(-mv.xyz);
    vW = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * mv;
  }
`;

const FILL_FRAG = /* glsl */ `
  uniform vec3 uBase;
  uniform vec3 uRim;
  uniform vec3 uAccent;
  uniform float uTime;
  uniform float uGlow;
  varying vec3 vN;
  varying vec3 vV;
  varying vec3 vW;
  void main() {
    vec3 n = normalize(vN);
    float ndl = dot(n, normalize(vec3(0.5, 0.8, 0.6))) * 0.5 + 0.5;
    float bands = floor(ndl * 3.0) / 3.0 + 0.15;
    vec3 col = uBase * (0.6 + 0.5 * bands);
    float fres = pow(1.0 - clamp(dot(n, normalize(vV)), 0.0, 1.0), 2.5);
    col += uRim * fres * (0.35 + 0.9 * uGlow);
    float scan = smoothstep(0.97, 1.0, sin(vW.y * 14.0 - uTime * 1.2) * 0.5 + 0.5);
    col += uAccent * scan * 0.5 * uGlow;
    gl_FragColor = vec4(min(col, vec3(0.9)), 1.0);
  }
`;

const CORE_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uTime;
  uniform float uIntensity;
  varying vec3 vN;
  varying vec3 vV;
  varying vec3 vW;
  void main() {
    vec3 n = normalize(vN);
    float fres = pow(1.0 - clamp(dot(n, normalize(vV)), 0.0, 1.0), 2.0);
    float pulse = 0.9 + 0.1 * sin(uTime * 2.2);
    float flow = 0.5 + 0.5 * sin(vW.y * 30.0 - uTime * 3.0);
    vec3 col = uColor * (0.75 + 0.4 * fres + 0.2 * flow) * pulse * uIntensity;
    gl_FragColor = vec4(col, 1.0);
  }
`;

// ---------- the screen: a sci-fi HUD drawn entirely in the shader ----------
const SCREEN_VERT = /* glsl */ `
  uniform float uRot;
  uniform float uMirror;
  varying vec2 vUv;
  void main() {
    // the model's own UVs are not usable, so the picture is built from the shape's position (-1..1)
    vec2 p = vec2(position.z, -position.x) / 0.8517;
    if (uMirror > 0.5) p.x = -p.x;
    float c = cos(uRot);
    float s = sin(uRot);
    vUv = vec2(c * p.x - s * p.y, s * p.x + c * p.y);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const SCREEN_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uPower;
  uniform float uGain;
  uniform float uPattern;
  uniform vec3 uC0;
  uniform vec3 uC1;
  uniform vec3 uC2;
  uniform vec3 uC3;
  uniform vec3 uDot;
  varying vec2 vUv;
  const float PI = 3.14159265;

  // 1 inside an arc that starts at "start" (0..1 turn) and is "len" long
  float arcMask(float t, float start, float len) {
    return step(mod(t - start + 1.0, 1.0), len);
  }

  float sdHex(vec2 p, float r) {
    const vec3 k = vec3(-0.866025404, 0.5, 0.577350269);
    p = abs(p);
    p -= 2.0 * min(dot(k.xy, p), 0.0) * k.xy;
    p -= vec2(clamp(p.x, -k.z * r, k.z * r), r);
    return length(p) * sign(p.y);
  }

  vec3 ringColor(float t) {
    float s = fract(t) * 4.0;
    vec3 c = uC0;
    c = mix(c, uC1, smoothstep(0.85, 1.15, s));
    c = mix(c, uC2, smoothstep(1.85, 2.15, s));
    c = mix(c, uC3, smoothstep(2.85, 3.15, s));
    return c;
  }

  void main() {
    vec2 p = vUv;
    float r = length(p);
    if (r > 1.0) discard;                        // the screen is round

    float turn = fract(atan(p.y, p.x) / (2.0 * PI) + 0.25); // 0 at the top, going around
    vec3 col = vec3(0.012, 0.012, 0.014);        // dark glass

    // faint guide rings
    col += vec3(0.02) * (smoothstep(0.012, 0.0, abs(r - 0.70)) + smoothstep(0.01, 0.0, abs(r - 0.66)));

    // outer ring: 4 colors with small gaps and a light that runs around it
    float ring = smoothstep(0.03, 0.0, abs(r - 0.93) - 0.025);
    float g = fract(turn * 4.0);
    float gap = smoothstep(0.0, 0.03, g) * smoothstep(0.0, 0.03, 1.0 - g);
    float sweep = pow(max(0.0, cos((turn - fract(uTime * 0.15)) * 2.0 * PI)), 8.0);
    col += ringColor(turn) * ring * gap * (0.55 + 0.9 * sweep);

    // thin rotating arcs
    float arcs = arcMask(turn, fract(uTime * 0.08), 0.18) + arcMask(turn, fract(0.5 - uTime * 0.05), 0.1);
    col += uDot * 0.5 * arcs * smoothstep(0.012, 0.0, abs(r - 0.84) - 0.006);

    // grey progress arc that breathes
    float plen = 0.3 + 0.15 * sin(uTime * 0.6);
    col += vec3(0.05) * arcMask(turn, 0.62, plen) * smoothstep(0.02, 0.0, abs(r - 0.77) - 0.02);

    // ----- dot matrix picture -----
    float inside = 1.0 - smoothstep(0.58, 0.62, r);
    vec2 q = p / 0.62;
    float n = 21.0;
    vec2 gp = q * (n * 0.5);
    vec2 id = floor(gp) + 0.5;
    vec2 f = fract(gp) - 0.5;
    vec2 c = id / (n * 0.5);                     // center of this dot, -1..1

    float mask = 0.0;
    vec3 tint = vec3(1.0);
    if (uPattern < 0.5) {
      // isometric cube: pointy hexagon, three faces with different brightness
      float sd = sdHex(vec2(c.y, c.x), 0.72);
      mask = 1.0 - smoothstep(-0.02, 0.06, sd);
      float a = degrees(atan(c.y, c.x));
      tint = (a > 30.0 && a < 150.0) ? vec3(1.0) : ((a > -90.0 && a <= 30.0) ? vec3(0.4) : vec3(0.65));
    } else {
      // heart
      vec2 hq = vec2(c.x * 1.55, c.y * 1.55 + 0.1);
      float hh = hq.x * hq.x + hq.y * hq.y - 1.0;
      float h = hh * hh * hh - hq.x * hq.x * hq.y * hq.y * hq.y;
      mask = smoothstep(0.02, -0.06, h);
    }

    float wave = 0.5 + 0.5 * sin(length(c) * 7.0 - uTime * 2.6);
    float pulse = 0.82 + 0.18 * sin(uTime * 2.0);
    float rad = mix(0.06, 0.42, mask * (0.55 + 0.45 * wave) * pulse);
    float dotm = smoothstep(rad, rad - 0.09, length(f));
    vec3 dcol = mix(vec3(0.035), uDot * tint, mask);
    col = mix(col, dcol, dotm * inside);

    // scan line + screen texture
    float scan = smoothstep(0.06, 0.0, abs(fract(uTime * 0.25) * 2.0 - 1.0 - p.y));
    col += uDot * 0.25 * scan * inside;
    col *= 0.94 + 0.06 * sin(p.y * 260.0 + uTime * 6.0);
    col *= smoothstep(1.0, 0.97, r);

    gl_FragColor = vec4(col * uPower * uGain, 1.0);
  }
`;

const HULL_VERT = /* glsl */ `
  uniform float uThickness;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    mv.xyz += normalize(normalMatrix * normal) * uThickness;
    gl_Position = projectionMatrix * mv;
  }
`;
const HULL_FRAG = /* glsl */ `
  uniform vec3 uColor;
  void main() { gl_FragColor = vec4(uColor, 1.0); }
`;

// full-screen background in LINEAR color so it matches your page exactly after the OutputPass
const BG_VERT = /* glsl */ `void main() { gl_Position = vec4(position.xy, 1.0, 1.0); }`;
const BG_FRAG = /* glsl */ `uniform vec3 uBg; void main() { gl_FragColor = vec4(uBg, 1.0); }`;

/* =====================================================
   HELPERS
   ===================================================== */
const SVG_NS = 'http://www.w3.org/2000/svg';
const DEG = Math.PI / 180;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smoothstep = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const easeInOutSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2;
const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const catmull = (p0, p1, p2, p3, t) =>
  0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);
const rgba = (hex, a) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

const CAM_DEFAULTS = { tx: 0, ty: 0, tz: 0, roll: 0, fov: 35 };
const CAM_KEYS = ['azim', 'elev', 'dist', 'tx', 'ty', 'tz', 'roll', 'fov'];

function sampleCamera(p, out) {
  const k = CAMERA_PATH;
  let i = 0;
  while (i < k.length - 2 && p >= k[i + 1].p) i++;
  const a = k[i], b = k[i + 1];
  const u = clamp((p - a.p) / (b.p - a.p), 0, 1);
  const p0 = k[Math.max(i - 1, 0)], p3 = k[Math.min(i + 2, k.length - 1)];
  CAM_KEYS.forEach((key) => {
    const g = (o) => (o[key] !== undefined ? o[key] : CAM_DEFAULTS[key]);
    out[key] = catmull(g(p0), g(a), g(b), g(p3), u);
  });
}

// scroll progress (0..1) -> how far along the disassembly is (0 = assembled, 1 = fully apart)
function assembleAmount(p) {
  const { disassembleEnd: a, holdEnd: b } = PHASE;
  let u;
  if (p < a) u = p / a;
  else if (p < b) u = 1;
  else u = 1 - (p - b) / (1 - b);
  return lerp(u, easeInOutSine(clamp(u, 0, 1)), EASE_MIX);
}

const AXES = { x: new THREE.Vector3(1, 0, 0), y: new THREE.Vector3(0, 1, 0), z: new THREE.Vector3(0, 0, 1) };
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _v = new THREE.Vector3();
const _w = new THREE.Vector3();

// world-space bounding box of ONE mesh (ignores its children)
function meshBox(m) {
  m.updateWorldMatrix(true, false);
  if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
  return m.geometry.boundingBox.clone().applyMatrix4(m.matrixWorld);
}

export function initCore() {
  const section = document.querySelector('#core');
  const canvas = document.querySelector('#coreCanvas');
  const svg = document.querySelector('#coreLines');
  const labelBox = document.querySelector('#coreLabels');
  if (!section || !canvas) return;

  const MOBILE = window.innerWidth < 768;
  const DEBUG = new URLSearchParams(window.location.search).has('coreDebug');

  // scroll progress 0..1 (the ONLY thing the scroll controls)
  const state = { t: 0 };
  ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: SCROLL_LENGTH,
    pin: true,
    anticipatePin: 1,
    onUpdate: (self) => { state.t = self.progress; },
  });

  // ---------- renderer + bloom ----------
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
  renderer.setClearColor(0x000000, 1);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 200);

  const rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, rt);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(1, 1), BLOOM.strength, BLOOM.radius, BLOOM.threshold));
  composer.addPass(new OutputPass());

  // background plane
  const bgMat = new THREE.ShaderMaterial({
    uniforms: { uBg: { value: new THREE.Color() } },
    vertexShader: BG_VERT, fragmentShader: BG_FRAG,
    depthTest: false, depthWrite: false,
  });
  const bgMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), bgMat);
  bgMesh.frustumCulled = false;
  bgMesh.renderOrder = -1000;
  scene.add(bgMesh);

  // ---------- materials ----------
  const uniforms = {
    uBase: { value: new THREE.Color() },
    uRim: { value: new THREE.Color() },
    uAccent: { value: new THREE.Color() },
    uTime: { value: 0 },
    uGlow: { value: 0 },
  };
  const fillMat = new THREE.ShaderMaterial({
    uniforms, vertexShader: VERT, fragmentShader: FILL_FRAG,
    polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1,
  });
  const coreMat = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(CORE.color) },
      uTime: uniforms.uTime,
      uIntensity: { value: CORE.intensity },
    },
    vertexShader: VERT, fragmentShader: CORE_FRAG,
    polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1,
  });
  const screenMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: uniforms.uTime,
      uPower: { value: 1 },
      uGain: { value: SCREEN.gain },
      uPattern: { value: SCREEN.pattern === 'heart' ? 1 : 0 },
      uRot: { value: (SCREEN.rotation || 0) * DEG },
      uMirror: { value: SCREEN.mirror ? 1 : 0 },
      uC0: { value: new THREE.Color(SCREEN.colors[0]) },
      uC1: { value: new THREE.Color(SCREEN.colors[1]) },
      uC2: { value: new THREE.Color(SCREEN.colors[2]) },
      uC3: { value: new THREE.Color(SCREEN.colors[3]) },
      uDot: { value: new THREE.Color(SCREEN.dot) },
    },
    vertexShader: SCREEN_VERT, fragmentShader: SCREEN_FRAG,
    side: THREE.DoubleSide,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
  });
  const lineMat = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.6 });
  const coreLineMat = new THREE.LineBasicMaterial({ color: new THREE.Color(CORE.color).multiplyScalar(CORE.intensity) });
  const hullMat = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color() }, uThickness: { value: HULL_THICKNESS } },
    vertexShader: HULL_VERT, fragmentShader: HULL_FRAG, side: THREE.BackSide,
  });

  function applyTheme() {
    const light = document.documentElement.getAttribute('data-theme') === 'light';
    const c = COLORS[light ? 'light' : 'dark'];
    uniforms.uBase.value.set(c.base);
    uniforms.uRim.value.set(c.rim);
    uniforms.uAccent.value.set(c.accent);
    lineMat.color.set(c.line);
    hullMat.uniforms.uColor.value.set(c.hull);
    const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
    bgMat.uniforms.uBg.value.set(bg || (light ? '#f4f4f4' : '#111111'));
  }
  applyTheme();
  new MutationObserver(applyTheme).observe(document.documentElement, {
    attributes: true, attributeFilter: ['data-theme'],
  });

  // ---------- lens flare (soft glow + thin streak, on the core only) ----------
  const flare = document.createElement('div');
  flare.className = 'core-flare';
  const mkEl = (cls, css) => {
    const d = document.createElement('div');
    d.className = `core-flare-el ${cls}`;
    Object.assign(d.style, css);
    flare.appendChild(d);
    return d;
  };
  const glowEl = mkEl('glow', {
    width: `${FLARE.glowSize}px`, height: `${FLARE.glowSize}px`, borderRadius: '50%',
    background: `radial-gradient(circle, ${rgba(FLARE.color, 0.85)} 0%, ${rgba(FLARE.color, 0.3)}22%, transparent 65%)`,
  });
  const streakEl = FLARE.streakWidth > 0
    ? mkEl('streak', {
        width: `${FLARE.streakWidth}px`, height: `${FLARE.streakHeight}px`, filter: 'blur(1.5px)',
        background: `linear-gradient(90deg, transparent, ${rgba(FLARE.color, 0.8)}, transparent)`,
      })
    : null;
  section.appendChild(flare);
  const place = (el, x, y) => { el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`; };

  // ---------- debug slider (add ?coreDebug to the address) ----------
  let debugP = null;
  let debugOut = null;
  if (DEBUG) {
    const box = document.createElement('div');
    box.className = 'core-debug';
    box.innerHTML = '<input type="range" min="0" max="1" step="0.001" value="0" /><pre></pre>';
    section.appendChild(box);
    debugOut = box.querySelector('pre');
    box.querySelector('input').addEventListener('input', (e) => { debugP = Number(e.target.value); });
  }

  // ---------- load ----------
  let model = null;
  let parts = [];
  let partMap = new Map();
  let idle = [];
  let labels = [];
  let coreObj = null;

  new GLTFLoader().load(modelUrl, (gltf) => {
    model = gltf.scene;

    const meshes = [];
    model.traverse((o) => { if (o.isMesh) meshes.push(o); });

    meshes.forEach((m) => {
      const isCore = m.name === 'Core';
      const isScreen = m.name === 'Screen';
      m.material = isCore ? coreMat : isScreen ? screenMat : fillMat;
      if (EDGE_LINES && !isScreen) m.add(new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry, 25), isCore ? coreLineMat : lineMat));
      if (HULL_OUTLINE && !isCore && !isScreen) m.add(new THREE.Mesh(m.geometry, hullMat));
      m.geometry.computeBoundingBox();
      m.userData.center = m.geometry.boundingBox.getCenter(new THREE.Vector3());
    });
    coreObj = model.getObjectByName('Core');
    scene.add(model);
    model.updateMatrixWorld(true);

    // remember where every part starts. Movements are written in WORLD directions, so for parts
    // that sit inside another part (legs, engine cubes) we store how to convert them to local ones.
        parts = meshes.map((obj) => {
      const rule = RULES.find((r) => r.match.test(obj.name));
      const base = obj.position.clone();
      const wp = new THREE.Vector3().setFromMatrixPosition(obj.matrixWorld);
      const dir = new THREE.Vector3(wp.x, 0, wp.z);
      if (dir.lengthSq() > 1e-6) dir.normalize();
      const inv = new THREE.Matrix3().setFromMatrix4(obj.parent.matrixWorld).invert();
      return { obj, name: obj.name, base, baseQuat: obj.quaternion.clone(), dir, inv, segs: rule ? rule.segs : [], k: 0, rule, openAxis: null, hinge: null };
    });

    // legs: work out, in the PARENT's space, which way each leg opens and where it hinges.
    // Everything is stored in local space, so the legs follow LegsHolder automatically.
    const openParts = parts.filter((p) => p.segs.some((s) => s.open));
    openParts.forEach((p) => {
      p.obj.updateMatrix();
      p.boxP = p.obj.geometry.boundingBox.clone().applyMatrix4(p.obj.matrix);
      p.centerP = p.boxP.getCenter(new THREE.Vector3());
    });
    const groups = new Map();
    openParts.forEach((p) => {
      const g = groups.get(p.obj.parent) || [];
      g.push(p);
      groups.set(p.obj.parent, g);
    });
    groups.forEach((g) => {
      const mid = new THREE.Vector3();
      g.forEach((p) => mid.add(p.centerP));
      mid.divideScalar(g.length);
      g.forEach((p) => {
        // outward = from the middle of all legs toward this leg (so each leg opens diagonally)
        const out = p.rule.outDir
          ? new THREE.Vector3(p.rule.outDir[0], 0, p.rule.outDir[1])
          : new THREE.Vector3(p.centerP.x - mid.x, 0, p.centerP.z - mid.z);
        if (out.lengthSq() < 1e-8) { out.set(1, 0, 0); console.warn(`[core] leg ${p.name}: no outward direction, add outDir`); }
        out.normalize();
        p.openAxis = new THREE.Vector3().crossVectors(out, AXES.y).normalize();
        const b = p.boxP, c = p.centerP;
        const piv = p.rule.pivot || 'origin';
        p.hinge = piv === 'top' ? new THREE.Vector3(c.x, b.max.y, c.z)
                : piv === 'bottom' ? new THREE.Vector3(c.x, b.min.y, c.z)
                : piv === 'center' ? c.clone()
                : p.base.clone();
      });
    });
    partMap = new Map(parts.map((p) => [p.name, p]));
    console.log('Core parts:', parts.map((p) => p.name));

        // rails that limit the engine cubes
    const railBoxes = [];
    model.traverse((o) => {
      if (!/^EngineRectangleLine/.test(o.name)) return;
      const b = new THREE.Box3();
      o.traverse((m) => { if (m.isMesh && !/^EngineCube/.test(m.name)) b.union(meshBox(m)); });
      if (!b.isEmpty()) railBoxes.push(b);
    });

    // how far (world Y) a cube may move up/down without leaving its rail
    function hoverRange(part, cfg) {
      if (!railBoxes.length) return [-cfg.amp, cfg.amp];
      const cb = meshBox(part.obj);
      const cc = cb.getCenter(new THREE.Vector3());
      let best = railBoxes[0], bd = Infinity;
      railBoxes.forEach((rb) => {
        const rc = rb.getCenter(new THREE.Vector3());
        const d = (rc.x - cc.x) ** 2 + (rc.z - cc.z) ** 2;
        if (d < bd) { bd = d; best = rb; }
      });
      const m = cfg.margin ?? 0.02;
      let lo = best.min.y - cb.min.y + m;
      let hi = best.max.y - cb.max.y - m;
      if (hi < lo) lo = hi = (lo + hi) / 2;
      return [lo, hi];
    }

    idle = IDLE.flatMap((cfg) => {
      const targets = cfg.match ? parts.filter((p) => cfg.match.test(p.name)) : [partMap.get(cfg.part)].filter(Boolean);
      if (!targets.length) { console.warn('[core] idle: nothing found for', cfg.part || cfg.match); return []; }
      return targets.map((part) => {
        const trigger = partMap.get(cfg.trigger || part.name);
        if (!trigger) { console.warn(`[core] idle: no trigger "${cfg.trigger}"`); return null; }
        const [lo, hi] = cfg.type === 'randomHover' ? hoverRange(part, cfg) : [0, 0];
        if (cfg.type === 'randomHover') console.log(`[core] ${part.name} range`, lo.toFixed(3), hi.toFixed(3));
        return { ...cfg, part, trigger, lo, hi, clock: 0, q: new THREE.Quaternion(), target: new THREE.Quaternion(), nextAt: 0.5, hoverY: 0, hoverTarget: 0, nextHoverAt: 0 };
      }).filter(Boolean);
    });

    labels = LABELS.map((cfg) => {
      const part = model.getObjectByName(cfg.part);
      if (!part) { console.warn(`[core] label: no part named "${cfg.part}"`); return null; }
      const el = document.createElement('div');
      el.className = `core-label ${cfg.side}`;
      el.textContent = cfg.text;
      el.style.top = `${cfg.y * 100}%`;
      labelBox.appendChild(el);

      const g = document.createElementNS(SVG_NS, 'g');
      const path = document.createElementNS(SVG_NS, 'path');
      path.setAttribute('class', 'core-line');
      path.setAttribute('pathLength', '1');
      path.style.strokeDasharray = '1';
      const dot = document.createElementNS(SVG_NS, 'circle');
      dot.setAttribute('class', 'core-dot');
      dot.setAttribute('r', '3');
      g.append(path, dot);
      svg.appendChild(g);
      return { cfg, part, el, path, dot, edgeX: 0, y: 0 };
    }).filter(Boolean);

    resize();
  });

  // ---------- size ----------
  let w = 1, h = 1, fit = 1;

  function resize() {
    w = section.clientWidth;
    h = section.clientHeight;
    const pr = MOBILE ? 1 : Math.min(window.devicePixelRatio, 2);
    renderer.setPixelRatio(pr);
    renderer.setSize(w, h, false);
    composer.setPixelRatio(pr);
    composer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    fit = w / h < 1 ? 1.6 : 1;
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);

    const s = section.getBoundingClientRect();
    labels.forEach((l) => {
      const r = l.el.getBoundingClientRect();
      l.y = r.top - s.top + r.height / 2;
      l.edgeX = l.cfg.side === 'right' ? r.left - s.left - 14 : r.right - s.left + 14;
    });
  }
  new ResizeObserver(resize).observe(section);
  resize();

  // ---------- move the parts ----------
      function movePartsAt(time) {
    parts.forEach((p) => {
      let ox = 0, oy = 0, oz = 0, spin = 0, open = 0, rx = 0, ry = 0, rz = 0, ksum = 0;
      p.segs.forEach((s) => {
        const k = easeInOutCubic(clamp((time - s.t0) / (s.t1 - s.t0), 0, 1));
        ksum += k;
        if (s.move) { ox += s.move[0] * k; oy += s.move[1] * k; oz += s.move[2] * k; }
        if (s.radial) { ox += p.dir.x * s.radial * k; oz += p.dir.z * s.radial * k; }
        if (s.spin) spin += s.spin * k;
        if (s.open) open += s.open * k;
        if (s.rotate) { rx += s.rotate[0] * k; ry += s.rotate[1] * k; rz += s.rotate[2] * k; }
      });
      p.k = p.segs.length ? ksum / p.segs.length : 0;
      _v.set(ox * SPREAD, oy * SPREAD, oz * SPREAD).applyMatrix3(p.inv);
      p.obj.position.copy(p.base).add(_v);
      p.obj.quaternion.copy(p.baseQuat);
      if (spin) p.obj.quaternion.multiply(_q.setFromAxisAngle(AXES.y, spin * DEG));
      if (rx || ry || rz) {
        _e.set(rx * DEG, ry * DEG, rz * DEG, 'XYZ');
        p.obj.quaternion.multiply(_q.setFromEuler(_e));
      }
      if (open && p.openAxis) {
        // rotate around the hinge in the parent's space (still a child, so it follows the holder)
        _q.setFromAxisAngle(p.openAxis, open * DEG);
        p.obj.quaternion.premultiply(_q);
        _w.copy(p.base).sub(p.hinge).applyQuaternion(_q).add(p.hinge).sub(p.base);
        p.obj.position.add(_w);
      }
    });
  }

  // ---------- idle animation (each part has its own clock) ----------
  function applyIdle(dt) {
    idle.forEach((it) => {
      const e = smoothstep(IDLE_START, 1.0, it.trigger.k);
      if (e <= 0.001) {
        it.clock = 0;
        it.q.identity();
        it.target.identity();
        it.nextAt = 0.5;
        it.hoverY = 0;
        it.hoverTarget = 0;
        it.nextHoverAt = 0;
        return;
      }
      it.clock += dt;
      const c = it.clock;
      const o = it.part.obj;

      if (it.type === 'step') {
        const tt = c - (it.delay || 0);
        if (tt <= 0) return;
        const cycle = it.turn + it.wait;
        const n = Math.floor(tt / cycle);
        const pr = easeInOutCubic(clamp((tt - n * cycle) / it.turn, 0, 1));
        const ang = (((n + pr) * it.deg * (it.dir || 1)) % 360) * DEG * e;
        o.quaternion.multiply(_q.setFromAxisAngle(AXES[it.axis || 'y'], ang));
      } else if (it.type === 'wobble') {
        const ph = it.phase || 0;
        _e.set(
          it.amp[0] * DEG * Math.sin(c * it.speed + ph) * e,
          it.amp[1] * DEG * Math.sin(c * it.speed * 0.8 + 1 + ph) * e,
          it.amp[2] * DEG * Math.cos(c * it.speed * 0.6) * e
        );
        o.quaternion.multiply(_q.setFromEuler(_e));
      } else if (it.type === 'hover') {
        o.position.y += Math.sin(c * it.speed + (it.phase || 0)) * it.amp * e;
            } else if (it.type === 'randomHover') {
        if (c >= it.nextHoverAt) {
          it.hoverTarget = lerp(it.lo, it.hi, Math.random()); // anywhere inside the rail
          it.nextHoverAt = c + it.every[0] + Math.random() * (it.every[1] - it.every[0]);
        }
        it.hoverY += (it.hoverTarget - it.hoverY) * (1 - Math.exp(-dt * it.smooth));
        _v.set(0, clamp(it.hoverY, it.lo, it.hi) * e, 0).applyMatrix3(it.part.inv);
        o.position.add(_v);
            } else if (it.type === 'spin') {
        _e.set(it.speed[0] * DEG * dt * e, it.speed[1] * DEG * dt * e, it.speed[2] * DEG * dt * e);
        it.q.multiply(_q.setFromEuler(_e)).normalize();
        o.quaternion.multiply(it.q);
        if (it.hover) o.position.y += (Math.sin(c * it.hoverSpeed) * it.hover + Math.sin(c * it.hoverSpeed * 0.53 + 1.7) * it.hover * 0.5) * e;
      } else if (it.type === 'random') {
        if (c >= it.nextAt) {
          const m = it.maxDeg * DEG;
          it.target.setFromEuler(_e.set((Math.random() - 0.5) * 2 * m, (Math.random() - 0.5) * 2 * m, (Math.random() - 0.5) * 2 * m));
          it.nextAt = c + it.every[0] + Math.random() * (it.every[1] - it.every[0]);
        }
        it.q.slerp(it.target, 1 - Math.exp(-dt * it.smooth));
        o.quaternion.multiply(_q.identity().slerp(it.q, e));
        o.position.y += (Math.sin(c * it.hoverSpeed) * it.hover + Math.sin(c * it.hoverSpeed * 0.53 + 1.7) * it.hover * 0.5) * e;
      }
    });
  }

  // ---------- draw loop (only while the section is on screen) ----------
  let visible = false;
  let prog = 0; // smoothed scroll progress
  new IntersectionObserver(([en]) => {
    if (en.isIntersecting && !visible) prog = state.t;
    visible = en.isIntersecting;
  }).observe(section);

  const cam = {};
  const ndc = new THREE.Vector3();

  gsap.ticker.add((time, deltaMs) => {
    if (!visible || !model) return;
    const dt = Math.min(deltaMs / 1000, 0.1);

    // smooth the scroll
    const target = debugP !== null ? debugP : state.t;
    prog += (target - prog) * (1 - Math.exp(-dt * DAMP));
    const f = assembleAmount(prog); // 0 = assembled, 1 = fully apart

    // 1) place parts, 2) idle on top
    movePartsAt(f * TOTAL);
    applyIdle(dt);

    // 3) camera
    sampleCamera(prog, cam);
    const az = (cam.azim + (Math.sin(time * 0.37) * 1.2 + Math.sin(time * 0.91 + 2) * 0.6) * CAMERA_SHAKE) * DEG;
    const el = clamp(cam.elev + Math.sin(time * 0.43 + 1) * 0.8 * CAMERA_SHAKE, -88, 88) * DEG;
    const dist = cam.dist * fit;
    camera.position.set(
      cam.tx + dist * Math.cos(el) * Math.sin(az),
      cam.ty + dist * Math.sin(el),
      cam.tz + dist * Math.cos(el) * Math.cos(az)
    );
    camera.up.set(Math.sin(cam.roll * DEG), Math.cos(cam.roll * DEG), 0);
    camera.lookAt(cam.tx, cam.ty, cam.tz);
    if (Math.abs(camera.fov - cam.fov) > 0.01) { camera.fov = cam.fov; camera.updateProjectionMatrix(); }

    uniforms.uTime.value = time;
    uniforms.uGlow.value = f;
    // the screen "wakes up" a little when the machine starts to open
    screenMat.uniforms.uPower.value = lerp(0.6, 1.0, smoothstep(0.0, 0.25, f)) * (0.97 + 0.03 * Math.sin(time * 37));

    composer.render();

    // 4) lens flare on the core (appears as soon as the core is uncovered)
    if (coreObj) {
      const exposed = partMap.get('OuterCore_Piece_1');
      const expose = smoothstep(0.2, 1.0, exposed ? exposed.k : f);
      ndc.copy(coreObj.userData.center);
      coreObj.localToWorld(ndc);
      ndc.project(camera);
      const x = (ndc.x * 0.5 + 0.5) * w;
      const y = (-ndc.y * 0.5 + 0.5) * h;
      const onScreen = 1 - smoothstep(1.0, 1.3, Math.max(Math.abs(ndc.x), Math.abs(ndc.y)));
      const inFront = ndc.z < 1 ? 1 : 0;
      const pulse = 0.92 + 0.08 * Math.sin(time * 2.2);
      flare.style.opacity = String(FLARE.intensity * expose * onScreen * inFront * pulse);
      place(glowEl, x, y);
      if (streakEl) place(streakEl, x, y);
    }

    // 5) leader lines follow their parts
    const lineT = smoothstep(0.7, 1.0, f);
    const elbow = w < 600 ? 60 : 150;
    labels.forEach((l) => {
      ndc.copy(l.part.userData.center || _v.set(0, 0, 0));
      l.part.localToWorld(ndc);
      ndc.project(camera);
      const ax = (ndc.x * 0.5 + 0.5) * w;
      const ay = (-ndc.y * 0.5 + 0.5) * h;
      const dir = l.cfg.side === 'right' ? 1 : -1;
      const ex = l.edgeX - dir * elbow;

      l.path.setAttribute('d', `M${ax} ${ay} L${ex} ${l.y} L${l.edgeX} ${l.y}`);
      l.path.style.strokeDashoffset = String(1 - lineT);
      l.dot.setAttribute('cx', ax);
      l.dot.setAttribute('cy', ay);
      l.dot.style.opacity = lineT;
      l.el.style.opacity = clamp((lineT - 0.5) * 2, 0, 1);
    });

    if (debugOut) {
      debugOut.textContent =
        `p     ${prog.toFixed(3)}\napart ${f.toFixed(3)}  t ${(f * TOTAL).toFixed(1)}s\n` +
        `azim  ${cam.azim.toFixed(1)}  elev ${cam.elev.toFixed(1)}\ndist  ${cam.dist.toFixed(1)}  ty ${cam.ty.toFixed(1)}`;
    }
  });
}