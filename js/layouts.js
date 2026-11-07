// Panel layouts. Each layout returns 2–6 polygons in unit space (0..1 of the photo area).
// Panels are painted in array order, so later panels sit ON TOP of earlier ones:
// a circle listed after a full rectangle turns the rectangle into "everything around the circle".
// Points may lie outside the unit square — the renderer clips to the photo area.

const rnd = (a, b) => a + Math.random() * (b - a);
const TAU = Math.PI * 2;
const FULL = [[0, 0], [1, 0], [1, 1], [0, 1]];

// set per call by randomLayout(): width / height of the photo area, keeps circles round
let K = 1;

const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];

function ellipse(cx, cy, rx, ry, steps = 72) {
  const pts = [];
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * TAU;
    pts.push([cx + rx * Math.cos(a), cy + ry * K * Math.sin(a)]);
  }
  return pts;
}
const circle = (cx, cy, r) => ellipse(cx, cy, r, r);

function star(cx, cy, r, rot = -Math.PI / 2, inner = 0.45) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 ? r * inner : r;
    const a = rot + (i * Math.PI) / 5;
    pts.push([cx + rr * Math.cos(a), cy + rr * K * Math.sin(a)]);
  }
  return pts;
}

/** n pie slices around (cx, cy), starting at angle a0 (radians). */
function pizza(n, cx, cy, a0 = rnd(0, TAU)) {
  const R = 3;
  const out = [];
  for (let k = 0; k < n; k++) {
    const pts = [[cx, cy]];
    const s0 = a0 + (k / n) * TAU, s1 = a0 + ((k + 1) / n) * TAU;
    for (let j = 0; j <= 4; j++) {
      const a = s0 + ((s1 - s0) * j) / 4;
      pts.push([cx + R * Math.cos(a), cy + R * Math.sin(a)]);
    }
    out.push(pts);
  }
  return out;
}

/** horizontal bands cut at the given y positions */
const strips4 = (cuts) => [0, ...cuts, 1].slice(0, -1).map((y, i, a) => rect(-0.1, y, 1.1, i + 1 < a.length ? a[i + 1] : 1));
const strips = (n) => Array.from({ length: n }, (_, i) => rect(0, i / n, 1, (i + 1) / n));
const columns = (n) => Array.from({ length: n }, (_, i) => rect(i / n, 0, (i + 1) / n, 1));
function grid(cols, rows) {
  const out = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) out.push(rect(c / cols, r / rows, (c + 1) / cols, (r + 1) / rows));
  return out;
}

// rough selfie face positions (measured on real selfies: phone at arm's length, laptop webcam)
const F = { x: 0.5, eyeY: 0.405, eyeDX: 0.09, eyeR: 0.075, noseY: 0.495, mouthY: 0.585, chinY: 0.665, browY: 0.345 };
const eyes = (r = F.eyeR) => [circle(F.x - F.eyeDX, F.eyeY, r), circle(F.x + F.eyeDX, F.eyeY, r)];
const mouth = (s = 1) => ellipse(F.x, F.mouthY, 0.12 * s, 0.05 * s);
const nose = (r = 0.055) => circle(F.x, F.noseY, r);
const faceOval = () => ellipse(F.x, 0.47, 0.21, 0.26);

function halfEllipse(cx, cy, rx, ry, a0, a1, steps = 36) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const a = a0 + ((a1 - a0) * i) / steps;
    pts.push([cx + rx * Math.cos(a), cy + ry * K * Math.sin(a)]);
  }
  return pts;
}
// beard / jaw crescent: lower half of a big oval minus a smaller one
function beard() {
  const outer = halfEllipse(F.x, 0.5, 0.22, 0.26, 0, Math.PI);
  const inner = halfEllipse(F.x, 0.5, 0.14, 0.13, Math.PI, 0);
  return [...outer, ...inner];
}

function bubbles(count) {
  const out = [];
  let tries = 0;
  while (out.length < count && tries++ < 400) {
    const r = rnd(0.11, 0.2);
    const c = [rnd(r, 1 - r), rnd(r * K, 1 - r * K)];
    if (out.every((b) => Math.hypot(b.c[0] - c[0], (b.c[1] - c[1]) / K) > b.r + r + 0.03)) out.push({ c, r });
  }
  return out.map((b) => circle(b.c[0], b.c[1], b.r));
}

function cross(cx, cy, deg) {
  return pizza(4, cx, cy, (deg * Math.PI) / 180);
}

export const LAYOUTS = [
  // ---------- 2 ----------
  { name: 'SPLIT PERSONALITY', make: () => columns(2) },
  { name: 'TOP & BOTTOM', make: () => strips(2) },
  {
    name: 'SAMURAI SLASH',
    make: () => {
      const t = rnd(0.15, 0.3);
      return [[[-1, 0], [0.5 + t, 0], [0.5 - t, 1], [-1, 1]], [[0.5 + t, 0], [2, 0], [2, 1], [0.5 - t, 1]]];
    },
  },
  { name: 'SPOTLIGHT', make: () => [FULL, circle(rnd(0.45, 0.55), rnd(0.42, 0.5), rnd(0.28, 0.34))] },
  { name: 'CENSORED', face: true, make: () => [FULL, rect(-0.1, F.eyeY - 0.05, 1.1, F.eyeY + 0.05)] },
  { name: 'MONOCLE', face: true, make: () => [FULL, circle(F.x + F.eyeDX, F.eyeY, 0.1)] },
  { name: 'SUNGLASSES', face: true, make: () => [FULL, ellipse(F.x, F.eyeY, 0.2, 0.06)] },
  { name: 'BIG MOUTH', face: true, make: () => [FULL, mouth(1.5)] },
  { name: 'STAR POWER', make: () => [FULL, star(0.5, 0.47, rnd(0.4, 0.46), -Math.PI / 2 + rnd(-0.25, 0.25))] },

  // ---------- 3 ----------
  { name: 'TRIPLE DECKER', make: () => strips(3) },
  { name: 'TRIPLE TOWER', make: () => columns(3) },
  { name: 'Y-SPLIT', make: () => pizza(3, rnd(0.45, 0.55), rnd(0.45, 0.55), -Math.PI / 2 + rnd(-0.3, 0.3)) },
  { name: 'BULLSEYE', make: () => [FULL, circle(0.5, 0.47, 0.38), circle(0.5, 0.47, 0.19)] },
  { name: 'GOOGLY EYES', face: true, make: () => [FULL, ...eyes()] },
  { name: 'CLOWN NOSE', face: true, make: () => [FULL, nose(0.075), mouth()] },
  { name: 'BLUSH', face: true, make: () => [FULL, circle(F.x - 0.15, 0.51, 0.07), circle(F.x + 0.15, 0.51, 0.07)] },
  { name: 'BEARD MODE', face: true, make: () => [FULL, beard(), mouth()] },
  { name: 'TWO FACE', face: true, make: () => [FULL, halfEllipse(F.x, 0.47, 0.21, 0.26, Math.PI / 2, Math.PI * 1.5), halfEllipse(F.x, 0.47, 0.21, 0.26, -Math.PI / 2, Math.PI / 2)] },
  { name: 'BUBBLE TEA', make: () => [FULL, ...bubbles(2)] },

  // ---------- 4 ----------
  { name: 'CLASSIC STRIP', make: () => strips(4) },
  { name: 'TOWER POWER', make: () => columns(4) },
  {
    name: 'QUAD SQUAD',
    make: () => {
      const cx = rnd(0.4, 0.6), cy = rnd(0.4, 0.6);
      return [rect(0, 0, cx, cy), rect(cx, 0, 1, cy), rect(0, cy, cx, 1), rect(cx, cy, 1, 1)];
    },
  },
  {
    name: 'BIG BOSS',
    make: () => {
      const s = rnd(0.52, 0.64);
      return [rect(0, 0, 1, s), rect(0, s, 1 / 3, 1), rect(1 / 3, s, 2 / 3, 1), rect(2 / 3, s, 1, 1)];
    },
  },
  {
    name: 'SIDEKICKS',
    make: () => {
      const s = rnd(0.55, 0.65);
      return [rect(0, 0, s, 1), rect(s, 0, 1, 1 / 3), rect(s, 1 / 3, 1, 2 / 3), rect(s, 2 / 3, 1, 1)];
    },
  },
  {
    name: 'LIGHTNING SLASH',
    make: () => {
      const t = rnd(0.1, 0.18);
      const b = [-0.6, 0.25, 0.5, 0.75, 1.6];
      return [0, 1, 2, 3].map((i) => [[b[i] + t, 0], [b[i + 1] + t, 0], [b[i + 1] - t, 1], [b[i] - t, 1]]);
    },
  },
  {
    name: 'EARTHQUAKE',
    make: () => {
      const L = [0], R = [0];
      for (let k = 1; k < 4; k++) { L.push(k / 4 + rnd(-0.09, 0.09)); R.push(k / 4 + rnd(-0.09, 0.09)); }
      L.push(1); R.push(1);
      return [0, 1, 2, 3].map((i) => [[0, L[i]], [1, R[i]], [1, R[i + 1]], [0, L[i + 1]]]);
    },
  },
  { name: 'PIZZA PARTY', make: () => cross(rnd(0.42, 0.58), rnd(0.42, 0.58), 45) },
  { name: 'TORNADO SPIN', make: () => cross(rnd(0.42, 0.58), rnd(0.42, 0.58), rnd(14, 32) * (Math.random() < 0.5 ? -1 : 1)) },
  {
    name: 'BRICK BREAKER',
    make: () => {
      const y = rnd(0.42, 0.58), a = rnd(0.3, 0.45), b = rnd(0.55, 0.7);
      return [rect(0, 0, a, y), rect(a, 0, 1, y), rect(0, y, b, 1), rect(b, y, 1, 1)];
    },
  },
  { name: 'FACE SWAP', face: true, make: () => [FULL, ...eyes(), mouth()] },
  { name: 'THIRD EYE', face: true, make: () => [FULL, ...eyes(), circle(F.x, F.browY - 0.04, 0.06)] },
  { name: 'FACE ZONES', face: true, make: () => strips4([F.browY, F.eyeY + 0.06, F.chinY - 0.01]) },
  { name: 'BUBBLE BATH', make: () => [FULL, ...bubbles(3)] },
  { name: 'TARGET LOCK', make: () => [FULL, circle(0.5, 0.47, 0.44), circle(0.5, 0.47, 0.29), circle(0.5, 0.47, 0.14)] },

  // ---------- 5 ----------
  { name: 'PIZZA FIVE', make: () => pizza(5, rnd(0.44, 0.56), rnd(0.44, 0.56)) },
  { name: 'FIVE LAYER CAKE', make: () => strips(5) },
  { name: 'STAR BURST', make: () => [...cross(0.5, 0.47, rnd(0, 90)), star(0.5, 0.47, rnd(0.3, 0.36), -Math.PI / 2)] },
  { name: 'FULL FACE', face: true, make: () => [FULL, ...eyes(), nose(), mouth()] },
  { name: 'FACE CARD', face: true, make: () => [FULL, faceOval(), ...eyes(), mouth()] },
  { name: 'FACE STACK', face: true, make: () => strips4([F.browY, F.eyeY + 0.05, F.mouthY - 0.04, F.chinY + 0.02]) },
  { name: 'BUBBLE PARTY', make: () => [FULL, ...bubbles(4)] },
  {
    name: 'CROSSFIRE',
    make: () => {
      const r = rnd(0.2, 0.26);
      return [...cross(0.5, 0.47, 45), circle(0.5, 0.47, r)];
    },
  },

  // ---------- 6 ----------
  { name: 'PIZZA SIX', make: () => pizza(6, rnd(0.44, 0.56), rnd(0.44, 0.56)) },
  { name: 'SIX PACK', make: () => grid(2, 3) },
  { name: 'TIC TAC', make: () => grid(3, 2) },
  {
    name: 'STAR PIZZA',
    make: () => {
      // five slices that meet between the star's arms, the star on top
      const rot = -Math.PI / 2;
      return [...pizza(5, 0.5, 0.47, rot + Math.PI / 5), star(0.5, 0.47, 0.34, rot)];
    },
  },
  { name: 'MEGA TARGET', make: () => [...columns(2), circle(0.5, 0.47, 0.44), circle(0.5, 0.47, 0.33), circle(0.5, 0.47, 0.22), circle(0.5, 0.47, 0.11)] },
  { name: 'FACE PARTY', face: true, make: () => [FULL, faceOval(), ...eyes(), nose(), mouth()] },
  { name: 'MUGSHOT', face: true, make: () => [...columns(2), ...eyes(), nose(), mouth()] },
];

let lastName = '';

/** Picks a panel count 2–6 uniformly, then a layout with that many panels. */
export function randomLayout(aspect = 1) {
  K = aspect;
  const built = LAYOUTS.map((L) => ({ L, n: L.make().length }));
  const counts = [...new Set(built.map((b) => b.n))];
  const n = counts[Math.floor(Math.random() * counts.length)];
  let pool = built.filter((b) => b.n === n && b.L.name !== lastName);
  if (!pool.length) pool = built.filter((b) => b.n === n);
  const { L } = pool[Math.floor(Math.random() * pool.length)];
  lastName = L.name;
  const fx = Math.random() < 0.5;
  const fy = !L.face && Math.random() < 0.5; // faces stay upright
  const panels = L.make().map((poly) => poly.map(([x, y]) => [fx ? 1 - x : x, fy ? 1 - y : y]));
  return { name: L.name, panels };
}
