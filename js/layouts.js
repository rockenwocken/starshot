// Panel layouts. Every layout returns 4 convex polygons in unit space (0..1).
// Points may lie outside the unit square — the renderer clips to the photo area.

const rnd = (a, b) => a + Math.random() * (b - a);
const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];

function crossAt(cx, cy, deg) {
  const a = (deg * Math.PI) / 180;
  const R = 3;
  const d1 = [Math.cos(a), Math.sin(a)];
  const d2 = [-Math.sin(a), Math.cos(a)];
  const c = [cx, cy];
  const p = (u, v) => [c[0] + R * (u * d1[0] + v * d2[0]), c[1] + R * (u * d1[1] + v * d2[1])];
  return [
    [c, p(1, 0), p(1, 1), p(0, 1)],
    [c, p(0, 1), p(-1, 1), p(-1, 0)],
    [c, p(-1, 0), p(-1, -1), p(0, -1)],
    [c, p(0, -1), p(1, -1), p(1, 0)],
  ];
}

export const LAYOUTS = [
  { name: 'CLASSIC STRIP', make: () => [0, 1, 2, 3].map((i) => rect(0, i / 4, 1, (i + 1) / 4)) },
  { name: 'TOWER POWER', make: () => [0, 1, 2, 3].map((i) => rect(i / 4, 0, (i + 1) / 4, 1)) },
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
  {
    name: 'PIZZA PARTY',
    make: () => crossAt(rnd(0.42, 0.58), rnd(0.42, 0.58), 45),
  },
  {
    name: 'TORNADO SPIN',
    make: () => crossAt(rnd(0.42, 0.58), rnd(0.42, 0.58), rnd(14, 32) * (Math.random() < 0.5 ? -1 : 1)),
  },
  {
    name: 'BRICK BREAKER',
    make: () => {
      const y = rnd(0.42, 0.58), a = rnd(0.3, 0.45), b = rnd(0.55, 0.7);
      return [rect(0, 0, a, y), rect(a, 0, 1, y), rect(0, y, b, 1), rect(b, y, 1, 1)];
    },
  },
];

let last = -1;
export function randomLayout() {
  let i;
  do { i = Math.floor(Math.random() * LAYOUTS.length); } while (i === last && LAYOUTS.length > 1);
  last = i;
  const L = LAYOUTS[i];
  const fx = Math.random() < 0.5, fy = Math.random() < 0.5;
  const panels = L.make().map((poly) => poly.map(([x, y]) => [fx ? 1 - x : x, fy ? 1 - y : y]));
  return { name: L.name, panels };
}
