// All the random silliness lives here. Add your own lines!

export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const ACTIONS = ['FLEX', 'DANCE', 'POSE', 'PANIC', 'WINK', 'SALUTE', 'BOW', 'SCREAM SILENTLY', 'STRUT', 'FREEZE', 'MOONWALK', 'SNEEZE'];
const CREATURES = [
  'A SPACE ALIEN', 'A PROTEIN SHAKE', 'A SAD PENGUIN', 'A TOFU BLOCK', 'A SUSHI CHEF', 'A KAIJU',
  'A POP IDOL', 'YOUR GRANDMA', 'A NINJA', 'A RUBBER DUCK', 'A BODYBUILDER', 'A LOST TOURIST',
  'A HAUNTED VENDING MACHINE', 'A DISCO ROBOT', 'A SLEEPY CAT', 'A NEWS ANCHOR',
];
const CLASSICS = [
  'UP! UP! CHU! CHU! CHU!', 'DOWN! DOWN! CHU!', 'LEFT! RIGHT! FREEZE!', 'POINT AT THE STARS!',
  'SURPRISED PIGEON FACE!', 'BLOW A KISS ♡', 'MAXIMUM MUSCLE!', 'SAMURAI STANCE!',
  'DO THE ROBOT!', 'PEACE SIGN! KAWAII!', 'YOU JUST WON THE LOTTERY!', 'SPICY RAMEN FACE!',
  'ALIEN ABDUCTION!', 'SHOW ME YOUR BICEPS!', 'SECRET AGENT MODE!', 'HEART HANDS ♡',
  'EVIL VILLAIN LAUGH!', 'MUSCLE MARCH! HUP! HUP!', 'FISH FACE!', 'TOO COOL FOR SCHOOL',
];
// The last panel is the big finale.
const LAST = [
  'LOOK INNOCENT...', 'HOLD YOUR BREATH!', 'BIG FINISH!', 'DO NOT LAUGH!',
  'FINAL BOSS FACE!', 'LAST ONE! GO WILD!', 'TOTALLY CALM FACE', 'GRAND FINALE POSE!',
];
const TAGS = ['チュッ！', 'すごい！', 'かわいい！', 'ファイト！', 'いくぞ！', 'キラキラ', 'ドキドキ', 'ムキムキ！'];

export function posePrompts(n = 4) {
  const out = [];
  const used = new Set();
  while (out.length < n - 1) {
    const p = Math.random() < 0.5 ? `${pick(ACTIONS)} LIKE ${pick(CREATURES)}!` : pick(CLASSICS);
    if (!used.has(p)) { used.add(p); out.push({ text: p, tag: pick(TAGS) }); }
  }
  out.push({ text: pick(LAST), tag: 'ドキドキ…' });
  return out;
}

const JUDGES = [
  { t: 'PERFECT!!', c: '#ffe600', w: 32, s: 250000 },
  { t: 'GREAT!', c: '#3dff8b', w: 24, s: 190000 },
  { t: 'SUGOI!', c: '#00e5ff', w: 16, s: 220000 },
  { t: 'KAWAII!', c: '#ff7ad9', w: 16, s: 210000 },
  { t: 'BOO...', c: '#b0a7c9', w: 12, s: 40000 },
];
export function judge() {
  let r = Math.random() * JUDGES.reduce((a, j) => a + j.w, 0);
  for (const j of JUDGES) { if ((r -= j.w) <= 0) return j; }
  return JUDGES[0];
}
export const FART_JUDGE = { t: 'MARVELOUS!!', c: '#ff7a00', s: 333330, sub: 'フィニッシュ！' };

const ADJ = ['ULTRA', 'MEGA', 'TURBO', 'HYPER', 'LEGENDARY', 'SPICY', 'KAWAII', 'FORBIDDEN', 'MUSCLE', 'GALACTIC', 'SLIGHTLY DAMP', 'DELUXE', 'MIDNIGHT', 'NEON'];
const NOUN = ['TOFU', 'PENGUIN', 'SAMURAI', 'NOODLE', 'IDOL', 'KAIJU', 'PUDDING', 'DISCO', 'PROTEIN', 'ROBOT', 'SHRIMP', 'GRANDMA', 'BURRITO', 'DUMPLING'];
const SUFFIX = ['SQUAD', 'ATTACK', 'FEVER', 'REVOLUTION', 'MARCH', 'EXPLOSION', '2000', 'TURBO EDITION', 'SAGA', 'DREAM', 'PANIC', 'PARADE'];
export function title() {
  return `${pick(ADJ)} ${pick(NOUN)} ${pick(SUFFIX)}`;
}
export function rank(score) {
  if (score >= 1050000) return 'SSS';
  if (score >= 950000) return 'S';
  if (score >= 850000) return 'A';
  if (score >= 700000) return 'B';
  return 'F(ART)';
}
