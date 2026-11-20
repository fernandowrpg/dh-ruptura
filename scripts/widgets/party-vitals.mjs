import { MODULE_ID, resolveActiveTheme, resolveActiveVariant } from '../theme-manager.mjs';
import { buildHeader, el, enableDrag, icon, place, setting } from './ui.mjs';
import { hideDockIcon, setDockBadge, setMinimized } from './dock.mjs';

export const WIDGET_ID = 'party-vitals';
const ELEMENT_ID = 'ruptura-vitals';
const ADVERSARY_ELEMENT_ID = 'ruptura-adversaries';
const MAX_PIPS = 12;
const DH_ID = 'daggerheart';
const DH_FEAR = 'ResourcesFear';
const DH_HOMEBREW = 'Homebrew';

/** Recursos do Daggerheart exibidos, na ordem. `marked`: o valor conta espaços marcados. */
const RESOURCES = [
  { key: 'hitPoints', icon: 'fa-heart', label: 'RUPTURA.Vitals.HitPoints', marked: true },
  { key: 'armor', icon: 'fa-shield-halved', label: 'RUPTURA.Vitals.Armor', marked: true },
  { key: 'hope', icon: 'fa-sun', label: 'RUPTURA.Vitals.Hope', marked: false },
  { key: 'stress', icon: 'fa-bolt', label: 'RUPTURA.Vitals.Stress', marked: true }
];

/** Adversários têm apenas vida e fadiga. */
const ADVERSARY_RESOURCES = RESOURCES.filter((def) => ['hitPoints', 'stress'].includes(def.key));

/** Lentes envolventes de óculos esportivo: largas por fora, estreitas junto ao nariz. */
const LENSES = 'M57 56C50 51 30 50 20 52C14.5 53 13 58.5 15 64.5C18 74 27 80 38 80C48 80 55 72.5 56.8 64C57.4 60.5 57.6 58 57 56ZM63 56C70 51 90 50 100 52C105.5 53 107 58.5 105 64.5C102 74 93 80 82 80C72 80 65 72.5 63.2 64C62.6 60.5 62.4 58 63 56Z';

/** Uma fileira de sete dentes entre x 38 e 82 (a boca). */
function teeth(y, height) {
  return Array.from({ length: 7 }, (_, k) =>
    `<rect class="rv-tooth" x="${(38.4 + k * 6.29).toFixed(2)}" y="${y}" width="5.5" height="${height}" rx="1.6"/>`).join('');
}

/**
 * Crânio de óculos cromados: osso claro, órbitas e nariz escuros, duas fileiras de dentes
 * e a mandíbula separada (.rv-jaw), que pode abrir. O brilho (.rv-glow) fica atrás das
 * lentes e cresce com o Medo.
 * Com o Medo no máximo (.rv-max), os óculos voam, os olhos viram fendas em brasa e a
 * mandíbula bate numa gargalhada (.rv-laugh). Com o Medo zerado (.rv-zero), ele fica
 * triste, ainda de óculos: a cabeça pende, o queixo cai e uma lágrima escorre.
 */
const SKULL_SVG = `
<svg viewBox="0 0 120 130" aria-hidden="true">
  <defs>
    <linearGradient id="rv-frame" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#8a8a98"/><stop offset="0.5" stop-color="#33333d"/><stop offset="1" stop-color="#5c5c68"/>
    </linearGradient>
    <linearGradient id="rv-lens" x1="0" y1="0.2" x2="1" y2="0.8">
      <stop class="rv-lens-warm" offset="0"/><stop class="rv-lens-hot" offset="0.28"/>
      <stop class="rv-lens-core" offset="0.55"/><stop class="rv-lens-deep" offset="0.8"/><stop class="rv-lens-edge" offset="1"/>
    </linearGradient>
    <linearGradient id="rv-lens-shade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1a0420" stop-opacity="0.45"/><stop offset="0.45" stop-color="#1a0420" stop-opacity="0"/>
    </linearGradient>
    <clipPath id="rv-lens-clip"><path d="${LENSES}"/></clipPath>
    <radialGradient id="rv-glow">
      <stop offset="0" stop-color="#ffffff"/><stop class="rv-glow-stop" offset="0.4"/>
      <stop class="rv-glow-stop" offset="1" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <g class="rv-head">
    <rect class="rv-cavity" x="38" y="90" width="44" height="31" rx="4"/>
    <g class="rv-jaw">
      <path class="rv-bone" d="M31 91L33 116Q36 122 48 129H72Q84 122 87 116L89 91H84V112Q84 116 80 116H40Q36 116 36 112V91Z"/>
      <g class="rv-teeth">${teeth(105, 10.5)}</g>
    </g>
    <path class="rv-bone" d="M60 4C84 4 104 20 104 44C104 54 101 60 100 66C103 70 105 76 101 82C97 87 91 89 88 92L84 93H36L32 92C29 89 23 87 19 82C15 76 17 70 20 66C19 60 16 54 16 44C16 20 36 4 60 4Z"/>
    <path class="rv-temple" d="M27 29C22 39 23 51 29 60M93 29C98 39 97 51 91 60"/>
    <g class="rv-eyes">
      <path class="rv-hollow" d="M27 61C27 54 33 51 41 52C49 53 53 56 53 62C53 70 48 76 40 76C32 76 27 69 27 61Z"/>
      <path class="rv-hollow" d="M93 61C93 54 87 51 79 52C71 53 67 56 67 62C67 70 72 76 80 76C88 76 93 69 93 61Z"/>
    </g>
    <path class="rv-hollow" d="M60 74C63 78 67 82 67 85C67 87.5 64.5 88.5 62.5 87L60 85L57.5 87C55.5 88.5 53 87.5 53 85C53 82 57 78 60 74Z"/>
    <g class="rv-teeth">${teeth(91.5, 12)}</g>
    <g class="rv-laugh">
      <path class="rv-hollow" d="M25 70C29 52 51 52 55 70C47 62 33 62 25 70Z"/>
      <path class="rv-hollow" d="M95 70C91 52 69 52 65 70C73 62 87 62 95 70Z"/>
      <circle class="rv-ember" cx="40" cy="60.5" r="2.6"/>
      <circle class="rv-ember" cx="80" cy="60.5" r="2.6"/>
    </g>
    <ellipse class="rv-glow" cx="40" cy="64" fill="url(#rv-glow)"/>
    <ellipse class="rv-glow" cx="80" cy="64" fill="url(#rv-glow)"/>
    <g class="rv-glasses">
      <path class="rv-frame" d="M15 56C11 54.5 7 53.5 2 52.5M105 56C109 54.5 113 53.5 118 52.5" stroke-width="4"/>
      <path d="${LENSES}" fill="url(#rv-lens)"/>
      <path d="${LENSES}" fill="url(#rv-lens-shade)"/>
      <g clip-path="url(#rv-lens-clip)">
        <path class="rv-shine" d="M27 48h6l-9 36h-6zM83 48h6l-9 36h-6z"/>
        <path class="rv-shine rv-shine-thin" d="M37 48h2.5l-9 36H28zM95 48h2.5l-9 36H86z"/>
        <path class="rv-streak" d="M74 48h1l-7 36h-1z"/>
      </g>
      <path class="rv-tint" d="${LENSES}"/>
      <path class="rv-frame" d="${LENSES}" stroke-width="2.2"/>
      <path class="rv-frame" d="M14 55C26 49 47 49.5 57.5 55.5M106 55C94 49 73 49.5 62.5 55.5M57 56Q60 52.5 63 56" stroke-width="4.2"/>
      <circle class="rv-screw" cx="60" cy="54.2" r="1.1"/>
      <path class="rv-rubber" d="M12.5 54.6L8 53.4M107.5 54.6L112 53.4M56 64Q58.5 67.5 57.2 71M64 64Q61.5 67.5 62.8 71"/>
    </g>
    <path class="rv-tear" d="M90 79c0 0-4.5 6-4.5 9a4.5 4.5 0 0 0 9 0c0-3-4.5-9-4.5-9z"/>
    <text class="rv-number" x="60" y="40" text-anchor="middle"></text>
  </g>
  <text class="rv-ha" x="2" y="20">HA</text>
  <text class="rv-ha rv-ha-late" x="92" y="12">HA</text>
</svg>`;

let element = null;
let adversaryElement = null;

/* ---------- Medo ---------- */

/** Medo atual e máximo, lidos do próprio sistema Daggerheart. `null` fora dele. */
function fearState() {
  if (game.system?.id !== DH_ID) return null;
  try {
    const homebrew = game.system.settings?.homebrew ?? game.settings.get(DH_ID, DH_HOMEBREW);
    const max = Number(homebrew?.maxFear) || 12;
    const value = Math.min(max, Math.max(0, Number(game.settings.get(DH_ID, DH_FEAR)) || 0));
    return { value, max };
  } catch {
    return null;
  }
}

function changeFear(delta) {
  const fear = fearState();
  if (!fear || !game.user.isGM) return;
  const next = Math.min(fear.max, Math.max(0, fear.value + delta));
  if (next !== fear.value) game.settings.set(DH_ID, DH_FEAR, next);
}

function buildSkull() {
  const skull = el('div', 'rv-skull');
  skull.innerHTML = SKULL_SVG;
  return skull;
}

function fearButton(className, label, glyph, delta) {
  const button = el('button', `rv-fear-btn ${className}`, glyph);
  button.type = 'button';
  button.title = label;
  button.setAttribute('aria-label', label);
  button.addEventListener('click', () => changeFear(delta));
  return button;
}

/** Mestre: crânio entre os botões de gastar e ganhar, dentro da Vigília. */
function buildFearGM() {
  const box = el('section', 'rv-fear');
  const row = el('div', 'rv-fear-row');
  row.append(
    fearButton('rv-spend', game.i18n.localize('RUPTURA.Vitals.SpendFear'), '−', -1),
    buildSkull(),
    fearButton('rv-gain', game.i18n.localize('RUPTURA.Vitals.GainFear'), '+', 1)
  );
  box.append(row, el('div', 'rv-fear-label'));
  return box;
}

/** Jogador: só o crânio, com um anel de marcadores em volta. */
function buildFearPlayer() {
  const box = el('section', 'rv-fear rv-relic');
  box.append(el('div', 'rv-ring'), buildSkull());
  return box;
}

function renderFear() {
  const box = element?.querySelector('.rv-fear');
  if (!box) return;
  const fear = fearState();
  box.hidden = !fear;
  setDockBadge(VITALS_DOCK.key, fear?.value ?? '');
  if (!fear) return;

  const label = `${game.i18n.localize('RUPTURA.Vitals.Fear')} ${fear.value} / ${fear.max}`;
  box.setAttribute('role', 'img');
  box.setAttribute('aria-label', label);
  if (!game.user.isGM) box.title = label;

  const ratio = fear.value / fear.max;
  box.classList.toggle('rv-max', fear.value >= fear.max);
  box.classList.toggle('rv-zero', fear.value <= 0);
  box.querySelector('.rv-number').textContent = String(fear.value);
  for (const glow of box.querySelectorAll('.rv-glow')) {
    glow.setAttribute('rx', (8 + ratio * 26).toFixed(1));
    glow.setAttribute('ry', (8 + ratio * 22).toFixed(1));
    glow.setAttribute('opacity', fear.value ? Math.min(1, 0.25 + ratio).toFixed(2) : '0');
  }
  box.querySelector('.rv-tint').setAttribute('opacity', (ratio * 0.55).toFixed(2));

  const text = box.querySelector('.rv-fear-label');
  if (text) text.textContent = label;

  const ring = box.querySelector('.rv-ring');
  if (ring) {
    if (ring.childElementCount !== fear.max) {
      ring.replaceChildren(...Array.from({ length: fear.max }, (_, i) => {
        const angle = (i / fear.max) * Math.PI * 2 - Math.PI / 2;
        const pip = el('span', 'rv-ring-pip');
        pip.style.left = `${(50 + Math.cos(angle) * 46).toFixed(2)}%`;
        pip.style.top = `${(50 + Math.sin(angle) * 46).toFixed(2)}%`;
        return pip;
      }));
    }
    Array.from(ring.children).forEach((pip, i) => pip.classList.toggle('on', i < fear.value));
  }
}

/* ---------- Vitais dos personagens ---------- */

function readResource(actor, key) {
  const system = actor.system ?? {};
  const resource = system.resources?.[key] ?? (key === 'armor' ? system.armorScore : null);
  if (!resource) return null;
  const max = Number(resource.max) || 0;
  const value = Math.max(0, Number(resource.value) || 0);
  return { value, max };
}

/** Personagens de jogadores que o usuário atual pode observar. */
function partyCharacters() {
  return game.actors
    .filter((actor) => actor.type === 'character' && actor.hasPlayerOwner && actor.testUserPermission(game.user, 'OBSERVER'))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function buildResource(actor, def) {
  const label = game.i18n.localize(def.label);
  const data = readResource(actor, def.key);
  const row = el('div', `rv-resource rv-${def.key}`);
  row.append(icon(def.icon));

  if (!data || data.max <= 0) {
    row.title = label;
    row.setAttribute('aria-label', `${label}: —`);
    row.append(el('span', 'rv-count', '—'));
    return row;
  }

  const summary = `${label}: ${data.value}/${data.max}`;
  row.title = summary;
  row.setAttribute('aria-label', summary);
  if (def.marked && data.value >= data.max) row.classList.add('rv-full');
  if (!def.marked && data.value <= 0) row.classList.add('rv-empty');

  if (data.max <= MAX_PIPS) {
    const pips = el('span', 'rv-pips');
    pips.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < data.max; i++) pips.append(el('span', i < data.value ? 'rv-pip on' : 'rv-pip'));
    row.append(pips);
  }
  row.append(el('span', 'rv-count', `${data.value}/${data.max}`));
  return row;
}

/** Limiares de dano (Maior e Grave) do ator, ou `null` se ele não os tiver. */
function buildThresholds(actor) {
  const data = actor.system?.damageThresholds;
  const major = Number(data?.major);
  const severe = Number(data?.severe);
  if (!Number.isFinite(major) || !Number.isFinite(severe) || (!major && !severe)) return null;

  const majorLabel = game.i18n.localize('RUPTURA.Vitals.Major');
  const severeLabel = game.i18n.localize('RUPTURA.Vitals.Severe');
  const row = el('div', 'rv-thresholds');
  const summary = `${game.i18n.localize('RUPTURA.Vitals.Thresholds')}: ${majorLabel} ${major}, ${severeLabel} ${severe}`;
  row.title = summary;
  row.setAttribute('aria-label', summary);

  for (const [label, value] of [[majorLabel, major], [severeLabel, severe]]) {
    const chip = el('span', 'rv-threshold');
    chip.setAttribute('aria-hidden', 'true');
    chip.append(el('span', 'rv-threshold-label', label), el('span', 'rv-threshold-value', String(value)));
    row.append(chip);
  }
  return row;
}

/** Adversários do combate em exibição; cada combatente usa o ator do próprio token. */
function combatAdversaries() {
  const combat = game.combat;
  if (!combat) return [];
  return combat.combatants
    .filter((combatant) => combatant.actor?.type === 'adversary')
    .map((combatant) => ({
      actor: combatant.actor,
      name: combatant.name,
      img: combatant.img ?? combatant.actor.img,
      defeated: !!(combatant.isDefeated ?? combatant.defeated)
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function buildCharacter(actor, { name = actor.name, img = actor.img, resources: defs = RESOURCES, className = '' } = {}) {
  const item = el('li', `rv-character ${className}`.trim());

  const open = el('button', 'rv-open');
  open.type = 'button';
  open.title = game.i18n.format('RUPTURA.Vitals.OpenSheet', { name });
  open.addEventListener('click', () => actor.sheet?.render(true));
  const portrait = el('img', 'rv-portrait');
  portrait.src = img;
  portrait.alt = '';
  open.append(portrait, el('span', 'rv-name', name));

  const resources = el('div', 'rv-resources');
  for (const def of defs) resources.append(buildResource(actor, def));

  item.append(open);
  const thresholds = buildThresholds(actor);
  if (thresholds) item.append(thresholds);
  item.append(resources);
  return item;
}

function renderList() {
  const list = element?.querySelector('.rv-list');
  if (!list) return;
  const rows = partyCharacters().map((actor) => buildCharacter(actor));
  if (!rows.length) rows.push(el('li', 'rv-none', game.i18n.localize('RUPTURA.Vitals.Empty')));
  list.replaceChildren(...rows);
}

/* ---------- Painéis ---------- */

function saveState(patch) {
  const state = { ...(setting('vitalsState', {}) ?? {}), ...patch };
  game.settings.set(MODULE_ID, 'vitalsState', state);
}

function saveAdversaryState(patch) {
  const current = (setting('vitalsState', {}) ?? {}).adversaries ?? {};
  saveState({ adversaries: { ...current, ...patch } });
}

/** Ícones das janelas minimizadas: a Vigília mostra o Medo; os Inimigos, quantos estão de pé. */
const VITALS_DOCK = {
  key: 'vitals',
  label: 'RUPTURA.Vitals.Title',
  icon: 'fa-skull',
  badge: () => fearState()?.value ?? ''
};

const ADVERSARY_DOCK = {
  key: 'adversaries',
  label: 'RUPTURA.Vitals.Adversaries',
  icon: 'fa-skull-crossbones',
  badge: () => combatAdversaries().filter((adversary) => !adversary.defeated).length || ''
};

/** Linha da Vigília com a variante ativa (por exemplo, o andar da Esfera). */
function renderVariant(variant = resolveActiveVariant()) {
  const line = element?.querySelector('.rv-variant');
  if (!line) return;
  line.hidden = !variant;
  line.replaceChildren();
  if (!variant) return;
  if (variant.icon) line.append(icon(variant.icon));
  line.append(el('span', null, game.i18n.localize(variant.label)));
}

/** Mestre: Vigília com o Medo no topo e os vitais de cada personagem. */
function mountGM() {
  element.append(buildHeader(element, 'RUPTURA.Vitals.Title', saveState, VITALS_DOCK), el('p', 'rv-variant'));
  if (fearState()) element.append(buildFearGM());
  element.append(el('ul', 'rv-list'));
}

/** Jogador: apenas o contador de Medo. */
function mountPlayer() {
  element.classList.add('rv-player');
  element.append(buildFearPlayer());
  enableDrag(element, element, saveState);
}

function unmountAdversaries() {
  adversaryElement?.remove();
  adversaryElement = null;
  hideDockIcon(ADVERSARY_DOCK.key);
}

/** Janela própria dos adversários: só para o mestre e só enquanto houver combate com eles. */
function renderAdversaries() {
  const adversaries = element && game.user.isGM ? combatAdversaries() : [];
  if (!adversaries.length) return unmountAdversaries();

  const rows = adversaries.map(({ actor, name, img, defeated }) => {
    const className = defeated ? 'rv-adversary rv-defeated' : 'rv-adversary';
    return buildCharacter(actor, { name, img, resources: ADVERSARY_RESOURCES, className });
  });

  if (adversaryElement) {
    adversaryElement.querySelector('.rv-list').replaceChildren(...rows);
    setDockBadge(ADVERSARY_DOCK.key, ADVERSARY_DOCK.badge());
    return;
  }

  const state = (setting('vitalsState', {}) ?? {}).adversaries ?? {};
  adversaryElement = el('aside', 'ruptura-vitals rv-adversaries');
  adversaryElement.id = ADVERSARY_ELEMENT_ID;
  adversaryElement.setAttribute('aria-label', game.i18n.localize('RUPTURA.Vitals.Adversaries'));
  const list = el('ul', 'rv-list');
  list.append(...rows);
  adversaryElement.append(buildHeader(adversaryElement, 'RUPTURA.Vitals.Adversaries', saveAdversaryState, ADVERSARY_DOCK), list);
  document.body.append(adversaryElement);
  place(adversaryElement, state.left ?? 400, state.top ?? 80);
  if (state.collapsed) setMinimized(adversaryElement, true, ADVERSARY_DOCK, saveAdversaryState);
}

const refreshList = foundry.utils.debounce(() => {
  renderList();
  renderAdversaries();
}, 50);

function mount() {
  if (element) return;
  const isGM = game.user.isGM;
  if (!isGM && !fearState()) return;
  const state = setting('vitalsState', {}) ?? {};

  element = el('aside', 'ruptura-vitals');
  element.id = ELEMENT_ID;
  element.setAttribute('aria-label', game.i18n.localize(isGM ? 'RUPTURA.Vitals.Title' : 'RUPTURA.Vitals.Fear'));
  if (isGM) mountGM();
  else mountPlayer();
  document.body.append(element);

  renderVariant();
  renderFear();
  renderList();
  place(element, state.left ?? 130, state.top ?? 80);
  if (isGM && state.collapsed) setMinimized(element, true, VITALS_DOCK, saveState);
  renderAdversaries();
}

function unmount() {
  unmountAdversaries();
  hideDockIcon(VITALS_DOCK.key);
  element?.remove();
  element = null;
}

/** Monta ou desmonta o widget conforme o tema ativo e a configuração do jogador. */
export function syncVitalsWidget() {
  if (!game.ready) return;
  const theme = resolveActiveTheme();
  const wanted = !!theme?.widgets?.includes(WIDGET_ID) && setting('showVitals', true);
  if (wanted) mount();
  else unmount();
}

export function registerVitalsWidget() {
  Hooks.on('ruptura.themeApplied', (_theme, variant) => {
    syncVitalsWidget();
    renderVariant(variant);
  });
  Hooks.once('ready', syncVitalsWidget);

  // Qualquer mudança que possa afetar os recursos ou o combate redesenha as listas.
  const events = [
    'createActor', 'updateActor', 'deleteActor',
    'createItem', 'updateItem', 'deleteItem',
    'createActiveEffect', 'updateActiveEffect', 'deleteActiveEffect',
    'updateUser', 'updateToken', 'updateActorDelta',
    'createCombat', 'updateCombat', 'deleteCombat',
    'createCombatant', 'updateCombatant', 'deleteCombatant'
  ];
  for (const event of events) Hooks.on(event, () => refreshList());

  // O Medo é uma configuração de mundo do sistema; a mudança chega a todos os clientes.
  const onSetting = (document) => {
    if (document?.key?.startsWith(`${DH_ID}.`)) renderFear();
  };
  Hooks.on('createSetting', onSetting);
  Hooks.on('updateSetting', onSetting);
}
