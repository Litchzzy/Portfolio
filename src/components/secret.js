import '../secret.css';

/*
  HIDDEN EASTER EGG
  - The messages live in src/data/secrets.js, but only in ENCRYPTED form.
  - The name, the key code and the ID are NOT written anywhere in the code. They are the password:
    typing the right three things rebuilds the key and decrypts the message in the visitor's browser.
  - Make new messages with tools/encrypt-message.html (same settings as below, keep them identical).
  - A message can have a song: put the file in src/data/Music/ and type its file name in the tool.
*/

const ITER = 600000;     // slows down guessing. Must be the same number in tools/encrypt-message.html
const MAX_TRIES = 5;     // wrong tries before a short pause
const LOCK_SECONDS = 30; // length of that pause (this is only a speed bump, the encryption is the real lock)
const MUSIC_VOLUME = 0.7; // starting volume of the mini player (0 to 1)

// Songs in src/data/Music. Only the ADDRESS is looked up here; the song itself is downloaded when she presses play.
const musicFiles = import.meta.glob('../data/Music/*.{mp3,ogg,wav,m4a,aac,flac,webm}', { query: '?url', import: 'default' });

const enc = new TextEncoder();
const dec = new TextDecoder();
const norm = (s) => String(s).normalize('NFKC').trim().toLowerCase(); // so upper/lower case and extra spaces do not matter
const fromB64 = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

// the encrypted messages are only downloaded when somebody actually tries to unlock (keeps the site light)
const loadSecrets = () => import('../data/secrets.js').then((m) => m.secrets);

// long messages are compressed before they are encrypted (the tool marks them with z: 1)
async function inflate(bytes) {
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function unlock(name, keycode, idRaw) {
  const secrets = await loadSecrets();
  const id = String(idRaw).trim();
  const entry = Object.prototype.hasOwnProperty.call(secrets, id) ? secrets[id] : null;

  // the same work is done even for an unknown ID, so nobody can find out which IDs exist
  const material = await crypto.subtle.importKey(
    'raw',
    enc.encode(`${norm(name)}|${norm(keycode)}|${id}`),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: entry ? fromB64(entry.salt) : new Uint8Array(16), iterations: ITER, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );
  if (!entry) throw new Error('denied');

  // a wrong name / key code / ID makes this throw
  const dataB64 = Array.isArray(entry.data) ? entry.data.join('') : entry.data;
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromB64(entry.iv), additionalData: enc.encode(id) },
    key,
    fromB64(dataB64)
  );
  let bytes = new Uint8Array(plain);
  if (entry.z) bytes = await inflate(bytes);
  return JSON.parse(dec.decode(bytes));
}

async function musicUrlFor(fileName) {
  if (!fileName) return null;
  const want = String(fileName).trim().toLowerCase();
  const key = Object.keys(musicFiles).find((k) => k.split('/').pop().toLowerCase() === want);
  if (!key) {
    console.warn(`[secret] song "${fileName}" was not found in src/data/Music`);
    return null;
  }
  try { return await musicFiles[key](); } catch { return null; }
}

// ---------- mini music player ----------
let audio = null;

function stopMusic() {
  // fades out, then stops (so closing the message does not cut the song abruptly)
  const a = audio;
  audio = null;
  if (!a) return;
  const v0 = a.volume;
  const t0 = performance.now();
  const step = (t) => {
    const k = Math.min(1, (t - t0) / 350);
    a.volume = v0 * (1 - k);
    if (k < 1) {
      requestAnimationFrame(step);
    } else {
      a.pause();
      a.removeAttribute('src');
      a.load();
    }
  };
  requestAnimationFrame(step);
}

const fmt = (s) => {
  if (!Number.isFinite(s)) return '0:00';
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
};

function buildPlayer(url, title) {
  const wrap = document.createElement('div');
  wrap.className = 'sc-player';
  wrap.innerHTML = `
    <button class="sc-play" type="button" aria-label="Play music">
      <svg class="i-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>
      <svg class="i-pause" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>
    </button>
    <div class="sc-track">
      <div class="sc-track-top"><span class="sc-track-name"></span><span class="sc-time">0:00</span></div>
      <input class="sc-seek" type="range" min="0" max="1000" value="0" step="1" aria-label="Seek" />
    </div>
    <div class="sc-eq" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
    <input class="sc-vol" type="range" min="0" max="100" value="${Math.round(MUSIC_VOLUME * 100)}" aria-label="Volume" />
  `;
  const btn = wrap.querySelector('.sc-play');
  const nameEl = wrap.querySelector('.sc-track-name');
  const timeEl = wrap.querySelector('.sc-time');
  const seek = wrap.querySelector('.sc-seek');
  const vol = wrap.querySelector('.sc-vol');
  nameEl.textContent = title;

  const paint = (el) => el.style.setProperty('--p', `${(el.value / el.max) * 100}%`);
  paint(seek);
  paint(vol);

  if (audio) { audio.pause(); audio = null; }
  const a = new Audio(url);
  audio = a;
  a.loop = true;            // the song repeats by itself
  a.preload = 'metadata';
  a.volume = MUSIC_VOLUME;

  let seeking = false;
  btn.addEventListener('click', async () => {
    if (a.paused) {
      try { await a.play(); } catch { nameEl.textContent = 'Could not play this song'; }
    } else {
      a.pause();
    }
  });
  a.addEventListener('play', () => { wrap.classList.add('playing'); btn.setAttribute('aria-label', 'Pause music'); });
  a.addEventListener('pause', () => { wrap.classList.remove('playing'); btn.setAttribute('aria-label', 'Play music'); });
  a.addEventListener('error', () => { nameEl.textContent = 'Song could not be loaded'; });
  a.addEventListener('timeupdate', () => {
    if (seeking || !a.duration) return;
    seek.value = (a.currentTime / a.duration) * 1000;
    paint(seek);
    timeEl.textContent = fmt(a.currentTime);
  });
  seek.addEventListener('input', () => {
    seeking = true;
    paint(seek);
    if (a.duration) {
      a.currentTime = (seek.value / 1000) * a.duration;
      timeEl.textContent = fmt(a.currentTime);
    }
  });
  seek.addEventListener('change', () => { seeking = false; });
  vol.addEventListener('input', () => { a.volume = vol.value / 100; paint(vol); });

  return wrap;
}

// ---------- the popup ----------
let overlay, card, form, view, status, btn, nameIn, keyIn, idIn;
let isOpen = false;
let busy = false;
let tries = 0;
let lockedUntil = 0;

function setStatus(text, bad = false) {
  status.textContent = text;
  status.classList.toggle('bad', bad);
}

function build() {
  overlay = document.createElement('div');
  overlay.className = 'sc-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-hidden', 'true');
  overlay.innerHTML = `
    <div class="sc-card">
      <button class="sc-close" type="button" aria-label="Close">&times;</button>

      <form class="sc-form" autocomplete="off">
        <span class="sc-kicker">Restricted</span>
        <h2>Identify Who You Are</h2>

        <label>Name
          <input name="name" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" required />
        </label>
        <label>KeyCode
          <input name="key" type="password" autocomplete="new-password" spellcheck="false" required />
        </label>
        <label>ID
          <input name="id" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" required />
        </label>

        <button class="sc-btn" type="submit">Unlock</button>
        <div class="sc-status" aria-live="polite"></div>
      </form>

      <div class="sc-view" hidden></div>
    </div>
  `;
  document.body.appendChild(overlay);

  card = overlay.querySelector('.sc-card');
  form = overlay.querySelector('.sc-form');
  view = overlay.querySelector('.sc-view');
  status = overlay.querySelector('.sc-status');
  btn = overlay.querySelector('.sc-btn');
  nameIn = form.elements.name;
  keyIn = form.elements.key;
  idIn = form.elements.id;

  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeSecret(); });
  overlay.querySelector('.sc-close').addEventListener('click', closeSecret);
  document.addEventListener('keydown', (e) => { if (isOpen && e.key === 'Escape') closeSecret(); });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (busy) return;

    const wait = Math.ceil((lockedUntil - Date.now()) / 1000);
    if (wait > 0) {
      setStatus(`Too many attempts. Try again in ${wait}s.`, true);
      return;
    }

    if (!window.crypto || !window.crypto.subtle) {
      setStatus('This needs a secure (https) page.', true);
      return;
    }

    busy = true;
    btn.disabled = true;
    setStatus('Verifying…');

    try {
      const data = await unlock(nameIn.value, keyIn.value, idIn.value);
      const songUrl = await musicUrlFor(data.music);
      showMessage(data, songUrl);
    } catch {
      tries += 1;
      if (tries >= MAX_TRIES) {
        tries = 0;
        lockedUntil = Date.now() + LOCK_SECONDS * 1000;
        setStatus(`Too many attempts. Try again in ${LOCK_SECONDS}s.`, true);
      } else {
        setStatus('Access denied. Check your details and try again.', true);
      }
      card.classList.remove('shake');
      void card.offsetWidth; // restarts the shake animation
      card.classList.add('shake');
    } finally {
      busy = false;
      btn.disabled = false;
    }
  });
}

function showMessage(data, songUrl) {
  // the typed details are cleared right away, they do not stay on the page
  form.reset();
  setStatus('');
  tries = 0;

  view.replaceChildren();

  const kicker = document.createElement('span');
  kicker.className = 'sc-kicker';
  kicker.textContent = 'Unlocked';

  const title = document.createElement('h2');
  title.textContent = data.title || '';

  const body = document.createElement('div');
  body.className = 'sc-body';
  String(data.body || '')
    .split(/\n+/)
    .filter(Boolean)
    .forEach((line, i) => {
      const p = document.createElement('p');
      p.textContent = line;
      p.style.setProperty('--d', `${0.25 + i * 0.18}s`);
      body.appendChild(p);
    });

  view.append(kicker);
  if (songUrl) {
    const songName = data.musicTitle || String(data.music).replace(/\.[^.]+$/, '');
    view.append(buildPlayer(songUrl, songName)); // sits between "Unlocked" and the title
  }
  view.append(title, body);
  form.hidden = true;
  view.hidden = false;
  card.classList.add('unlocked');
}

export function openSecret() {
  if (!overlay) build();
  if (isOpen) return;
  isOpen = true;
  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.classList.add('no-scroll');
  setTimeout(() => nameIn.focus(), 380);
}

export function closeSecret() {
  if (!isOpen) return;
  isOpen = false;
  stopMusic();
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('no-scroll');

  // after it has faded out: wipe everything (the message is removed from the page, the form is back)
  setTimeout(() => {
    if (isOpen) return;
    form.reset();
    form.hidden = false;
    view.hidden = true;
    view.replaceChildren();
    card.classList.remove('unlocked', 'shake');
    setStatus('');
  }, 400);
}