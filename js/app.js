import { randomLayout } from './layouts.js';
import * as sfx from './sfx.js';
import { START_SOUNDS } from './start-sounds.js';
import { posePrompts, judge, FART_JUDGE, title, rank, shuffle, pick } from './words.js';

// ---------- config ----------
const W = 1080, H = 1440;
const PA = { x: 40, y: 168, w: 1000, h: 1072 }; // photo area
const INTERVAL = 1000; // ms between photos
const COUNT_STEP = 1000; // ms per countdown number
const PANEL_COLORS = ['#ff2e88', '#00e5ff', '#ffe600', '#7a2cff', '#ff7a00', '#3dff8b'];
const STICKERS = ['✨', '⭐', '💥', '💪', '💖', '🌟', '⚡', '🔥', '🍣', '👾', '🎤', '🍜'];

// ---------- dom ----------
const $ = (s) => document.querySelector(s);
const cv = $('#cv');
const g = cv.getContext('2d');
const video = $('#video');
const screenEl = $('#screen');
const stage = $('#stage');
const banner = $('#banner');
const countEl = $('#count');
const judgesEl = $('#judges');
const flashEl = $('#flash');
const btnShoot = $('#btn-shoot');
const btnFlip = $('#btn-flip');
const btnMute = $('#btn-mute');

// ---------- state ----------
let facing = 'user';
let stream = null;
let state = 'title'; // title | ready | running | done
let layout = null;
let captures = []; // per panel: { img, sticker, stickerPos, stickerRot } | null
let active = -1;
let score = 0;
let combo = 0;
let finalTitle = '';
let finalRank = '';
let bgLayer = null;
let muted = false;

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- geometry ----------
const toPx = ([x, y]) => [PA.x + x * PA.w, PA.y + y * PA.h];

function polyPath(ctx, poly) {
  ctx.beginPath();
  poly.forEach((p, i) => {
    const [x, y] = toPx(p);
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  });
  ctx.closePath();
}

function bbox(poly) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of poly) {
    const [x, y] = toPx(p);
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
  }
  x0 = Math.max(x0, PA.x); y0 = Math.max(y0, PA.y);
  x1 = Math.min(x1, PA.x + PA.w); y1 = Math.min(y1, PA.y + PA.h);
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

// Visible centre of a panel (polygon clipped to the photo area), in 0..1 of the canvas.
function panelCenter(poly) {
  const clamp = (v) => Math.min(1, Math.max(0, v));
  const pts = poly.map(([x, y]) => [clamp(x), clamp(y)]);
  const b = bbox(poly);
  let cx = 0, cy = 0;
  pts.forEach(([x, y]) => { cx += x; cy += y; });
  cx /= pts.length; cy /= pts.length;
  let [px, py] = toPx([cx, cy]);
  // keep it inside the bbox
  px = Math.min(Math.max(px, b.x + 60), b.x + b.w - 60);
  py = Math.min(Math.max(py, b.y + 40), b.y + b.h - 40);
  return [px / W, py / H];
}

function drawCover(ctx, src, sw, sh, b, mirror) {
  if (!sw || !sh) return;
  const s = Math.max(b.w / sw, b.h / sh);
  const dw = sw * s, dh = sh * s;
  const dx = b.x + (b.w - dw) / 2;
  const dy = b.y + (b.h - dh) * 0.4; // a bit more headroom: faces sit high
  ctx.save();
  if (mirror) {
    ctx.translate(b.x * 2 + b.w, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(src, dx, dy, dw, dh);
  ctx.restore();
}

// ---------- static background layer ----------
function buildBackground() {
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const x = c.getContext('2d');

  // orange to pink
  const grd = x.createLinearGradient(0, 0, W, H);
  grd.addColorStop(0, '#ff7a00');
  grd.addColorStop(0.55, '#ff2e88');
  grd.addColorStop(1, '#7a2cff');
  x.fillStyle = grd;
  x.fillRect(0, 0, W, H);

  // halftone
  x.fillStyle = 'rgba(255,255,255,0.16)';
  for (let yy = 0; yy < H; yy += 26) {
    for (let xx = (yy / 26) % 2 ? 13 : 0; xx < W; xx += 26) {
      x.beginPath(); x.arc(xx, yy, 4 + 3 * (yy / H), 0, Math.PI * 2); x.fill();
    }
  }

  // stars
  const star = (cx, cy, r, col, rot) => {
    x.save(); x.translate(cx, cy); x.rotate(rot);
    x.beginPath();
    for (let i = 0; i < 10; i++) {
      const rr = i % 2 ? r * 0.45 : r;
      const a = (i * Math.PI) / 5 - Math.PI / 2;
      x.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    x.closePath();
    x.fillStyle = col; x.fill();
    x.lineWidth = 6; x.strokeStyle = '#120620'; x.stroke();
    x.restore();
  };

  // header
  x.save();
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.lineJoin = 'round';
  let hp = 128;
  x.font = `${hp}px "Dela Gothic One"`;
  while (x.measureText('STARSHOT').width > 780 && hp > 40) { hp -= 2; x.font = `${hp}px "Dela Gothic One"`; }
  x.translate(W / 2, 88);
  x.rotate(-0.025);
  x.lineWidth = 20; x.strokeStyle = '#120620';
  x.fillStyle = '#00e5ff';
  x.strokeText('STARSHOT', 8, 8);
  x.fillText('STARSHOT', 8, 8);
  x.strokeText('STARSHOT', 0, 0);
  x.fillStyle = '#ffe600';
  x.fillText('STARSHOT', 0, 0);
  x.restore();
  star(78, 82, 50, '#ffe600', 0.2);
  star(1004, 92, 44, '#00e5ff', -0.3);
  star(150, 146, 18, '#fffaf2', 0.5);

  // footer plate
  roundRect(x, 30, 1262, 1020, 158, 22);
  x.fillStyle = '#120620';
  x.fill();
  roundRect(x, 40, 1272, 1000, 138, 16);
  x.lineWidth = 4; x.strokeStyle = '#ff2e88';
  x.stroke();

  bgLayer = c;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// ---------- rendering ----------
function placeholder(i, poly, t) {
  const b = bbox(poly);
  g.fillStyle = PANEL_COLORS[i % PANEL_COLORS.length];
  g.fillRect(b.x, b.y, b.w, b.h);
  // moving stripes
  g.save();
  g.globalAlpha = 0.18;
  g.fillStyle = '#120620';
  const off = (t / 20) % 80;
  for (let k = -b.h - 80; k < b.w + b.h; k += 80) {
    g.beginPath();
    g.moveTo(b.x + k + off, b.y);
    g.lineTo(b.x + k + off + 36, b.y);
    g.lineTo(b.x + k + off + 36 - b.h, b.y + b.h);
    g.lineTo(b.x + k + off - b.h, b.y + b.h);
    g.closePath();
    g.fill();
  }
  g.restore();
  const [cx, cy] = panelCenter(poly);
  const size = Math.min(150, Math.max(60, Math.min(b.w, b.h) * 0.55));
  g.save();
  g.translate(cx * W, cy * H);
  g.rotate(Math.sin(t / 300 + i) * 0.15);
  g.font = `${size}px "Dela Gothic One"`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.lineWidth = size / 7;
  g.lineJoin = 'round';
  g.strokeStyle = '#120620';
  g.fillStyle = '#fffaf2';
  g.strokeText('?', 0, 0);
  g.fillText('?', 0, 0);
  g.restore();
}

function drawSticker(c, poly) {
  const b = bbox(poly);
  const size = Math.max(54, Math.min(b.w, b.h) * 0.22);
  const [x, y] = c.stickerPos;
  g.save();
  g.translate(x, y);
  g.rotate(c.stickerRot);
  g.font = `${size}px serif`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(c.sticker, 0, 0);
  g.restore();
}

function videoReady() {
  return video.readyState >= 2 && video.videoWidth > 0;
}

function render(t) {
  g.drawImage(bgLayer, 0, 0);

  // photo area
  g.save();
  g.beginPath();
  g.rect(PA.x, PA.y, PA.w, PA.h);
  g.clip();
  g.fillStyle = '#120620';
  g.fillRect(PA.x, PA.y, PA.w, PA.h);

  const mirror = facing === 'user';
  if (state === 'ready' || state === 'title') {
    if (videoReady()) drawCover(g, video, video.videoWidth, video.videoHeight, PA, mirror);
  } else if (layout) {
    layout.panels.forEach((poly, i) => {
      g.save();
      polyPath(g, poly);
      g.clip();
      const c = captures[i];
      if (c) {
        // every snapshot covers the whole photo area; the panel clip shows only its slice
        g.drawImage(c.img, PA.x, PA.y, PA.w, PA.h);
        drawSticker(c, poly);
      } else if (i === active && videoReady()) {
        drawCover(g, video, video.videoWidth, video.videoHeight, PA, mirror);
      } else {
        placeholder(i, poly, t);
      }
      g.restore();
    });
  }

  // outlines
  if (layout) {
    g.lineJoin = 'round';
    if (state === 'ready') {
      g.setLineDash([26, 18]);
      g.lineDashOffset = -t / 30;
      g.lineWidth = 8;
      g.strokeStyle = 'rgba(255,250,242,0.9)';
      layout.panels.forEach((p) => { polyPath(g, p); g.stroke(); });
      g.setLineDash([]);
    } else {
      g.lineWidth = 18;
      g.strokeStyle = '#120620';
      layout.panels.forEach((p) => { polyPath(g, p); g.stroke(); });
      g.lineWidth = 5;
      g.strokeStyle = '#fffaf2';
      layout.panels.forEach((p) => { polyPath(g, p); g.stroke(); });
      if (state === 'running' && active >= 0 && !captures[active]) {
        const pulse = 0.5 + 0.5 * Math.sin(t / 90);
        g.lineWidth = 12 + pulse * 10;
        g.strokeStyle = pulse > 0.5 ? '#ffe600' : '#00e5ff';
        polyPath(g, layout.panels[active]);
        g.stroke();
      }
    }
  }
  g.restore();

  // frame around photo area
  g.lineWidth = 12;
  g.strokeStyle = '#120620';
  g.strokeRect(PA.x, PA.y, PA.w, PA.h);

  drawKanaTag();
  drawFooter(t);
}

function drawKanaTag() {
  g.save();
  g.translate(870, PA.y + 4);
  g.rotate(-0.05);
  g.font = '30px "DotGothic16"';
  const tw = g.measureText('スターショット').width;
  roundRect(g, -tw / 2 - 18, -24, tw + 36, 48, 10);
  g.fillStyle = '#120620';
  g.fill();
  g.fillStyle = '#ffe600';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('スターショット', 0, 1);
  g.restore();
}

function fitText(text, maxW, startPx, font) {
  let px = startPx;
  g.font = `${px}px ${font}`;
  while (g.measureText(text).width > maxW && px > 18) {
    px -= 2;
    g.font = `${px}px ${font}`;
  }
  return px;
}

function drawFooter(t) {
  g.save();
  g.textBaseline = 'middle';
  const cx = W / 2;
  if (state === 'done') {
    g.textAlign = 'center';
    fitText(finalTitle, 920, 60, '"Dela Gothic One"');
    g.lineWidth = 10; g.lineJoin = 'round'; g.strokeStyle = '#ff2e88';
    g.strokeText(finalTitle, cx, 1312);
    g.fillStyle = '#ffe600';
    g.fillText(finalTitle, cx, 1312);
    g.font = '24px "Press Start 2P"';
    g.fillStyle = '#00e5ff';
    g.fillText(`RANK ${finalRank} ★ SCORE ${score.toLocaleString('en-US')}`, cx, 1366);
    g.font = '13px "Press Start 2P"';
    g.fillStyle = 'rgba(255,250,242,0.55)';
    g.fillText(`${dateStamp()}  ★  STARSHOT`, cx, 1397);
  } else if (state === 'running') {
    g.font = '30px "Press Start 2P"';
    g.textAlign = 'left';
    g.fillStyle = '#ffe600';
    g.fillText(`COMBO x${combo}`, 80, 1341);
    g.textAlign = 'right';
    g.fillStyle = '#00e5ff';
    g.fillText(score.toLocaleString('en-US').padStart(9, ' '), 1000, 1341);
  } else {
    g.textAlign = 'center';
    g.font = '28px "Press Start 2P"';
    g.fillStyle = Math.floor(t / 500) % 2 ? '#ffe600' : '#fffaf2';
    g.fillText('PRESS SHOT!', cx, 1320);
    g.font = '18px "Press Start 2P"';
    g.fillStyle = '#ff7ad9';
    g.fillText(`STAGE: ${layout ? layout.name : '???'}`, cx, 1372);
  }
  g.restore();
}

function dateStamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function loop(t) {
  if (bgLayer) render(t);
  requestAnimationFrame(loop);
}

// ---------- capture ----------
function capturePanel(i) {
  const poly = layout.panels[i];
  const b = bbox(poly);
  // snapshot of the full frame — together the four slices form one picture
  const c = document.createElement('canvas');
  c.width = PA.w; c.height = PA.h;
  const x = c.getContext('2d');
  if (videoReady()) {
    drawCover(x, video, video.videoWidth, video.videoHeight, { x: 0, y: 0, w: PA.w, h: PA.h }, facing === 'user');
  }
  // sticker at a random spot near an edge (convex mix of centre and a corner)
  const [ccx, ccy] = panelCenter(poly);
  const corner = toPx(poly[Math.floor(Math.random() * poly.length)]);
  const k = 0.55 + Math.random() * 0.15;
  const sx = ccx * W + (corner[0] - ccx * W) * k;
  const sy = ccy * H + (corner[1] - ccy * H) * k;
  captures[i] = {
    img: c,
    sticker: pick(STICKERS),
    stickerPos: [Math.min(Math.max(sx, b.x + 40), b.x + b.w - 40), Math.min(Math.max(sy, b.y + 40), b.y + b.h - 40)],
    stickerRot: (Math.random() - 0.5) * 0.8,
  };
}

// ---------- overlay fx ----------
function showBanner(p, panel = -1) {
  // keep the speech bubble away from the panel that is about to be shot
  const low = panel >= 0 && panelCenter(layout.panels[panel])[1] < 0.5;
  banner.classList.toggle('low', low);
  banner.classList.remove('hidden');
  banner.querySelector('.banner-text').textContent = p.text;
  banner.querySelector('.banner-tag').textContent = p.tag || '';
  banner.style.animation = 'none';
  void banner.offsetWidth;
  banner.style.animation = '';
}
const hideBanner = () => banner.classList.add('hidden');

function showCount(txt, go = false) {
  countEl.classList.remove('hidden');
  countEl.classList.toggle('go', go);
  countEl.textContent = txt;
  countEl.style.animation = 'none';
  void countEl.offsetWidth;
  countEl.style.animation = '';
}

function flash(big = false) {
  flashEl.classList.remove('on');
  void flashEl.offsetWidth;
  flashEl.classList.add('on');
  const cls = big ? 'bigshake' : 'shake';
  screenEl.classList.remove('shake', 'bigshake');
  void screenEl.offsetWidth;
  screenEl.classList.add(cls);
}

function popJudge(j, i, big = false) {
  const [x, y] = panelCenter(layout.panels[i]);
  const el = document.createElement('div');
  el.className = 'judge' + (big ? ' big' : '');
  el.style.left = big ? '50%' : `${Math.min(Math.max(x * 100, 32), 68)}%`;
  el.style.top = `${y * 100}%`;
  el.style.color = j.c;
  el.textContent = j.t;
  if (j.sub || combo > 1) {
    const s = document.createElement('small');
    s.textContent = j.sub ? `${j.sub}  COMBO x${combo}` : `COMBO x${combo}`;
    el.appendChild(s);
  }
  judgesEl.appendChild(el);
  setTimeout(() => el.remove(), 1200);
}

// ---------- the show ----------
function newRound() {
  layout = randomLayout();
  captures = layout.panels.map(() => null);
  active = -1;
  score = 0;
  combo = 0;
  state = 'ready';
  hideBanner();
  countEl.classList.add('hidden');
  $('#controls').classList.remove('hidden');
  $('#results').classList.add('hidden');
  btnShoot.disabled = false;
  btnFlip.disabled = false;
}

async function shoot() {
  if (state !== 'ready') return;
  sfx.initAudio();
  state = 'running';
  btnShoot.disabled = true;
  btnFlip.disabled = true;

  const order = shuffle([0, 1, 2, 3]);
  const prompts = posePrompts();
  const sounds = shuffle(sfx.FUNNY).slice(0, 3);

  // 1. the voice
  showBanner({ text: 'GET READY!', tag: 'いくぞ！' });
  const vd = sfx.playVoice();
  await wait(Math.min(vd, 3.2) * 1000 + 150);

  // 2. beat + countdown, first panel already live
  const totalBeats = Math.ceil(((COUNT_STEP * 3 + INTERVAL * 3) / 1000) / 0.5) + 2;
  sfx.beat(totalBeats, 0.5);
  active = order[0];
  showBanner(prompts[0], active);
  for (const n of [3, 2, 1]) {
    showCount(String(n));
    sfx.beep(false);
    await wait(COUNT_STEP);
  }
  countEl.classList.add('hidden');

  // 3. four photos
  for (let k = 0; k < 4; k++) {
    const i = order[k];
    capturePanel(i);
    const last = k === 3;
    combo++;
    if (last) {
      sfx.fart();
      flash(true);
      score += FART_JUDGE.s;
      popJudge(FART_JUDGE, i, true);
      hideBanner();
      active = -1;
    } else {
      sounds[k]();
      flash(false);
      const j = judge();
      score += j.s;
      popJudge(j, i);
      active = order[k + 1];
      showBanner(prompts[k + 1], active);
      await wait(INTERVAL);
    }
  }

  // 4. results
  await wait(1300);
  finalTitle = title();
  finalRank = rank(score);
  state = 'done';
  sfx.jingle();
  showBanner({ text: `RANK ${finalRank}!`, tag: finalRank.startsWith('F') ? 'くさい！' : 'おめでとう！' });
  setTimeout(hideBanner, 1800);
  $('#controls').classList.add('hidden');
  $('#results').classList.remove('hidden');
}

// ---------- export ----------
function fileName() {
  return `starshot-${dateStamp().replace(/[.: ]/g, '')}.png`;
}
function toBlob() {
  render(performance.now());
  return new Promise((r) => cv.toBlob(r, 'image/png'));
}
async function save() {
  sfx.click();
  const blob = await toBlob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = fileName();
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
async function share() {
  sfx.click();
  const blob = await toBlob();
  const file = new File([blob], fileName(), { type: 'image/png' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: 'STARSHOT', text: `${finalTitle} ★ RANK ${finalRank}` }); } catch (e) { /* cancelled */ }
  } else {
    save();
  }
}

// ---------- camera ----------
async function startCamera() {
  if (stream) stream.getTracks().forEach((t) => t.stop());
  stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 1280 } },
    audio: false,
  });
  video.srcObject = stream;
  await video.play().catch(() => {});
}

// ---------- sizing ----------
function fit() {
  const r = stage.getBoundingClientRect();
  const pad = 40;
  const aw = r.width - pad, ah = r.height - pad;
  let w = aw, h = (aw * H) / W;
  if (h > ah) { h = ah; w = (ah * W) / H; }
  screenEl.style.width = `${Math.floor(w)}px`;
  screenEl.style.height = `${Math.floor(h)}px`;
}

// ---------- wiring ----------
$('#btn-start').addEventListener('click', async () => {
  sfx.initAudio();
  sfx.chu();
  const err = $('#title-error');
  err.classList.add('hidden');
  try {
    await startCamera();
  } catch (e) {
    err.textContent = `CAMERA ERROR: ${e.name || e}. Allow camera access (HTTPS needed) and press START again.`;
    err.classList.remove('hidden');
    return;
  }
  sfx.loadVoices(START_SOUNDS.map((f) => `assets/start/${f}`));
  $('#title').classList.add('hidden');
  fit();
  newRound();
});

btnShoot.addEventListener('click', shoot);
btnFlip.addEventListener('click', async () => {
  if (state !== 'ready') return;
  sfx.click();
  facing = facing === 'user' ? 'environment' : 'user';
  try { await startCamera(); } catch (e) { facing = facing === 'user' ? 'environment' : 'user'; }
});
btnMute.addEventListener('click', () => {
  muted = !muted;
  sfx.setMuted(muted);
  btnMute.classList.toggle('off', muted);
  btnMute.querySelector('small').textContent = muted ? 'OFF' : 'ON';
  if (!muted) sfx.click();
});
$('#btn-save').addEventListener('click', save);
$('#btn-share').addEventListener('click', share);
$('#btn-again').addEventListener('click', () => { sfx.click(); newRound(); });

window.addEventListener('keydown', (e) => {
  if (e.code === 'Space' || e.code === 'Enter') {
    e.preventDefault();
    if (state === 'ready') shoot();
    else if (state === 'done') newRound();
    else if (state === 'title') $('#btn-start').click();
  }
});
window.addEventListener('resize', fit);

// ---------- boot ----------
(async () => {
  try {
    await Promise.all([
      document.fonts.load('128px "Dela Gothic One"'),
      document.fonts.load('28px "DotGothic16"', 'スターショット'),
      document.fonts.load('28px "Press Start 2P"'),
    ]);
  } catch (e) { /* fonts optional */ }
  buildBackground();
  fit();
  requestAnimationFrame(loop);
})();
