// A mente por trás dos encaixes: o fundo da tela de Encaixe dos Sigilos.
// Um cérebro visto de cima, com um tentáculo para cada encaixe. Velado, ele é só um
// padrão orgânico distorcido; quando o mestre revela, as dobras se firmam num cérebro
// que pulsa. Encaixe vazio: o tentáculo fica recolhido junto à mente. Sigilo encaixado:
// o tentáculo se estende até ele e acende a parte da mente que aquele sigilo prendia.
// Arte gerada aqui mesmo, com semente fixa: todos veem o mesmo desenho.

/** Lado do viewBox; o centro da mente fica no meio. */
export const VIEW = 600;
const C = VIEW / 2;

/** Raio do anel dos encaixes, em unidades do viewBox. */
export const SOCKET_RADIUS = 246;
/** Raio de um encaixe, em unidades do viewBox (o tentáculo para na borda). */
const SOCKET_SIZE = 34;
/** O cérebro é desenhado em tamanho cheio e encolhido, para sobrar espaço aos tentáculos. */
const BRAIN_SCALE = 0.74;
/** Meia-largura e meia-altura do cérebro já encolhido. */
const BRAIN_RX = 148 * BRAIN_SCALE;
const BRAIN_RY = 172 * BRAIN_SCALE;

/* ---------- Números ---------- */

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const f = (n) => Math.round(n * 10) / 10;
const i = (n) => Math.round(n);

/** Ângulo (graus, 0 = direita) do encaixe `index` de `total`; o primeiro fica no topo. */
export function slotAngle(index, total) {
  return -90 + (360 / total) * index;
}

function polar(radius, deg, rx = radius) {
  const a = (deg * Math.PI) / 180;
  return { x: C + rx * Math.cos(a), y: C + radius * Math.sin(a) };
}

/* ---------- Hemisférios ---------- */

// Hemisfério esquerdo, visto de cima: frontal no alto, occipital embaixo.
const LEFT = 'M296 128C252 114 186 140 160 200C138 252 140 330 158 392C176 446 228 482 270 476C286 474 294 466 296 456'
  + 'C300 400 292 330 297 270C300 220 292 170 296 128Z';

function mirror(path) {
  return path.replace(/(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g, (_, x, y) => `${f(VIEW - Number(x))} ${y}`);
}

const RIGHT = mirror(LEFT);

/** Uma dobra do córtex: caminhada sinuosa, com curvatura própria que às vezes se inverte. */
function fold(rand, cx) {
  let angle = rand() * Math.PI * 2;
  let curl = (rand() < 0.5 ? -1 : 1) * (0.12 + rand() * 0.22);
  const r = Math.sqrt(rand());
  const t = rand() * Math.PI * 2;
  let x = cx + Math.cos(t) * 80 * r;
  let y = C + Math.sin(t) * 172 * r;
  const steps = 9 + Math.floor(rand() * 14);
  let d = `M${i(x)} ${i(y)}`;
  for (let s = 0; s < steps; s++) {
    angle += curl + (rand() - 0.5) * 0.5;
    if (rand() < 0.14) curl = -curl;
    x += Math.cos(angle) * 7;
    y += Math.sin(angle) * 7;
    d += `L${i(x)} ${i(y)}`;
  }
  return d;
}

/**
 * Dobras de um hemisfério em lotes. Cada lote é desenhado como tubo (contorno escuro,
 * carne, brilho) por cima dos anteriores: é a sobreposição que dá a cara de córtex.
 */
function foldBatches(rand, cx, prefix) {
  const batches = [];
  for (let b = 0; b < 16; b++) {
    let d = '';
    for (let k = 0; k < 6; k++) d += fold(rand, cx);
    batches.push({ id: `${prefix}${b}`, d });
  }
  return batches;
}

// Estilo inline com variáveis: as cores vêm de quem usa a arte (velada ou revelada) e
// atravessam os <use>, onde seletores de classe não chegam.
function tubes(batches) {
  return batches.map(({ id }) => `<use href="#${id}" style="stroke:var(--rs-sulcus);stroke-width:12"/>`
    + `<use href="#${id}" style="stroke:var(--rs-gyrus);stroke-width:7.5"/>`
    + `<use href="#${id}" style="stroke:var(--rs-ridge);stroke-width:1.8" transform="translate(-1.5 -1.8)"/>`).join('');
}

/* ---------- Tentáculos ---------- */

function cubic(p0, p1, p2, p3, t) {
  const u = 1 - t;
  return {
    x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
    y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y
  };
}

/**
 * Tentáculo que sai de baixo da mente até o encaixe: corpo afinando (polígono), a linha
 * central (por onde corre o impulso) e o traço que a máscara usa para fazê-lo crescer.
 */
function tentacle(rand, deg) {
  const base = polar(BRAIN_RY * 0.78, deg, BRAIN_RX * 0.78);
  const tip = polar(SOCKET_RADIUS - SOCKET_SIZE - 2, deg);
  const swing = (rand() < 0.5 ? -1 : 1) * (14 + rand() * 18);
  const side = ((deg + 90) * Math.PI) / 180;
  const n = { x: Math.cos(side), y: Math.sin(side) };
  const p1 = { x: base.x + (tip.x - base.x) * 0.35 + n.x * swing, y: base.y + (tip.y - base.y) * 0.35 + n.y * swing };
  const p2 = { x: base.x + (tip.x - base.x) * 0.72 - n.x * swing * 0.9, y: base.y + (tip.y - base.y) * 0.72 - n.y * swing * 0.9 };

  const samples = 30;
  const pts = Array.from({ length: samples + 1 }, (_, s) => cubic(base, p1, p2, tip, s / samples));
  const left = [];
  const right = [];
  pts.forEach((p, s) => {
    const q = pts[Math.min(s + 1, samples)];
    const o = pts[Math.max(s - 1, 0)];
    const dx = q.x - o.x;
    const dy = q.y - o.y;
    const len = Math.hypot(dx, dy) || 1;
    const w = 11 * (1 - s / samples) ** 1.2 + 1.4;
    left.push(`${f(p.x - (dy / len) * w)} ${f(p.y + (dx / len) * w)}`);
    right.push(`${f(p.x + (dy / len) * w)} ${f(p.y - (dx / len) * w)}`);
  });
  const body = `M${left.join('L')}L${right.reverse().join('L')}Z`;
  // A espinha corre da ponta para a mente (o impulso sobe); o crescimento, da mente para a ponta.
  const spine = `M${f(tip.x)} ${f(tip.y)}C${f(p2.x)} ${f(p2.y)} ${f(p1.x)} ${f(p1.y)} ${f(base.x)} ${f(base.y)}`;
  const grow = `M${f(base.x)} ${f(base.y)}C${f(p1.x)} ${f(p1.y)} ${f(p2.x)} ${f(p2.y)} ${f(tip.x)} ${f(tip.y)}`;
  return { body, spine, grow, tip };
}

/* ---------- SVG ---------- */

const cache = new Map();

/**
 * Desenha a mente para `slots` (lista de { id, color }), na ordem dos encaixes.
 * Os estados (velada, revelada, sigilo encaixado) ficam no CSS, por classes.
 */
export function mindSvg(slots) {
  const key = slots.map((slot) => `${slot.id}:${slot.color}`).join('|');
  if (!cache.has(key)) cache.set(key, draw(slots));
  return cache.get(key);
}

function draw(slots) {
  const rand = rng(0x5e1d);
  const total = slots.length;
  const shrink = `translate(${C} ${C}) scale(${BRAIN_SCALE}) translate(${-C} ${-C})`;

  const glows = slots.map((slot, n) => {
    const p = polar(92, slotAngle(n, total), 80);
    return `<circle class="rs-glow" data-floor="${slot.id}" cx="${f(p.x)}" cy="${f(p.y)}" r="76" fill="url(#rs-glow-${slot.id})"/>`;
  }).join('');
  const glowDefs = slots.map((slot) =>
    `<radialGradient id="rs-glow-${slot.id}"><stop offset="0" stop-color="${slot.color}" stop-opacity=".85"/>`
    + `<stop offset="1" stop-color="${slot.color}" stop-opacity="0"/></radialGradient>`).join('');

  // Cada tentáculo é revelado por uma máscara: um traço largo que cresce da mente até a
  // ponta (stroke-dashoffset no CSS). Recolhido, só o começo do traço aparece.
  const tentacles = slots.map((slot, n) => {
    const { body, spine, grow, tip } = tentacle(rand, slotAngle(n, total));
    return `<g class="rs-tendril" data-floor="${slot.id}" style="--rs-floor:${slot.color};--rs-order:${n}">`
      + `<mask id="rs-grow-${slot.id}" maskUnits="userSpaceOnUse" x="0" y="0" width="${VIEW}" height="${VIEW}">`
      + `<path class="rs-grow" d="${grow}" pathLength="100"/></mask>`
      + `<g mask="url(#rs-grow-${slot.id})">`
      + `<path class="rs-tendril-body" d="${body}"/>`
      + `<path class="rs-tendril-rings" d="${spine}"/>`
      + `<path class="rs-tendril-spine" d="${spine}" pathLength="100"/></g>`
      + `<circle class="rs-latch" cx="${f(tip.x)}" cy="${f(tip.y)}" r="9"/></g>`;
  }).join('');

  const left = foldBatches(rand, 226, 'rs-fl');
  const right = foldBatches(rand, 374, 'rs-fr');
  const paths = [...left, ...right].map(({ id, d }) => `<path id="${id}" d="${d}"/>`).join('');

  return `
<svg class="rs-mind" viewBox="0 0 ${VIEW} ${VIEW}" aria-hidden="true" focusable="false">
  <defs>
    <radialGradient id="rs-flesh" cx="50%" cy="42%" r="62%">
      <stop offset="0" stop-color="#c9839f"/><stop offset=".6" stop-color="#8e4677"/><stop offset="1" stop-color="#3e1339"/>
    </radialGradient>
    <radialGradient id="rs-aura"><stop offset=".35" stop-color="#b44dff" stop-opacity=".25"/><stop offset="1" stop-color="#b44dff" stop-opacity="0"/></radialGradient>
    ${glowDefs}
    <filter id="rs-veil" x="-30%" y="-30%" width="160%" height="160%">
      <feTurbulence type="fractalNoise" baseFrequency=".009" numOctaves="2" seed="7" result="noise"/>
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="150" xChannelSelector="R" yChannelSelector="G"/>
      <feGaussianBlur stdDeviation="2.4"/>
    </filter>
    <clipPath id="rs-hemi-l"><path d="${LEFT}"/></clipPath>
    <clipPath id="rs-hemi-r"><path d="${RIGHT}"/></clipPath>
    <g id="rs-folds" fill="none" stroke-linecap="round" stroke-linejoin="round">${paths}</g>
    <g id="rs-brain-art">
      <path d="${LEFT}" style="fill:var(--rs-base)"/>
      <path d="${RIGHT}" style="fill:var(--rs-base)"/>
      <g clip-path="url(#rs-hemi-l)" fill="none" stroke-linecap="round" stroke-linejoin="round">${tubes(left)}</g>
      <g clip-path="url(#rs-hemi-r)" fill="none" stroke-linecap="round" stroke-linejoin="round">${tubes(right)}</g>
    </g>
  </defs>
  <circle class="rs-ring" cx="${C}" cy="${C}" r="${SOCKET_RADIUS}"/>
  <circle class="rs-ring rs-ring-inner" cx="${C}" cy="${C}" r="${SOCKET_RADIUS - 52}"/>
  <circle class="rs-aura" cx="${C}" cy="${C}" r="250" fill="url(#rs-aura)"/>
  <g class="rs-tendrils">${tentacles}</g>
  <g transform="translate(${C} ${C}) rotate(-32) scale(1.12) translate(${-C} ${-C}) ${shrink}">
    <use class="rs-brain rs-brain-veiled" href="#rs-brain-art" filter="url(#rs-veil)"/>
  </g>
  <g transform="${shrink}">
    <g class="rs-brain rs-brain-clear">
      <use href="#rs-brain-art" style="--rs-base:url(#rs-flesh)"/>
      <path class="rs-brain-edge" d="${LEFT}"/>
      <path class="rs-brain-edge" d="${RIGHT}"/>
    </g>
  </g>
  <g class="rs-glows">${glows}</g>
</svg>`;
}
