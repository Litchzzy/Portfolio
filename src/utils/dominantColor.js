const cache = new Map();

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  let h = 0;
  let s = 0;
  if (d) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return [h, s, l];
}

function hslToHex(h, s, l) {
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(255 * c).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// Returns the main color of a picture as a hex string, like '#0f4c81'
export async function getDominantColor(src) {
  if (cache.has(src)) return cache.get(src);

  const img = await loadImage(src);
  const SIZE = 64; // the picture is shrunk to 64x64 so this is fast
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, SIZE, SIZE);
  const { data } = ctx.getImageData(0, 0, SIZE, SIZE);

  // 12 groups of similar hues; the strongest, most colorful group wins
  const buckets = Array.from({ length: 12 }, () => ({ w: 0, r: 0, g: 0, b: 0 }));
  let allR = 0, allG = 0, allB = 0, allN = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
    if (a < 125) continue;

    allR += r; allG += g; allB += b; allN++;

    const [h, s, l] = rgbToHsl(r, g, b);
    if (l < 0.1 || l > 0.92) continue;           // skip almost black / almost white
    const w = s * (1 - Math.abs(2 * l - 1));     // colorful, medium-bright pixels count more
    if (w < 0.05) continue;                      // skip grays

    const k = Math.floor(h / 30) % 12;
    buckets[k].w += w;
    buckets[k].r += r * w;
    buckets[k].g += g * w;
    buckets[k].b += b * w;
  }

  let best = buckets[0];
  buckets.forEach((bk) => { if (bk.w > best.w) best = bk; });

  let r, g, b, boost = true;
  if (best.w > 0) {
    r = best.r / best.w;
    g = best.g / best.w;
    b = best.b / best.w;
  } else if (allN) {
    // black & white picture: use the average color instead
    r = allR / allN; g = allG / allN; b = allB / allN;
    boost = false;
  } else {
    throw new Error('empty image');
  }

  let [h, s, l] = rgbToHsl(r, g, b);
  if (boost) s = Math.max(s, 0.35);              // keep the color from looking washed out
  l = Math.min(0.55, Math.max(0.28, l));         // not too dark, not too bright for the white text

  const hex = hslToHex(h, s, l);
  cache.set(src, hex);
  return hex;
}

// Finds the color for every project that wants "auto" and hands it to onColor(index, color)
export function applyAutoColors(list, onColor) {
  list.forEach(async (p, i) => {
    if (!p.autoColor) return;
    const src = p.image || (p.images && p.images[0]);
    if (!src) return;
    try {
      const color = await getDominantColor(src);
      p.color = color; // the popup reads this when it opens
      onColor(i, color);
    } catch {
      // picture could not be read: the default color stays
    }
  });
}