import { MODULE_ID, resolveActiveTheme } from '../theme-manager.mjs';

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

const LENSES = 'M20 56c0-3 2-4 5-4h26c3 0 5 2 5 5 0 12-8 20-18 20S20 68 20 56zM100 56c0-3-2-4-5-4H69c-3 0-5 2-5 5 0 12 8 20 18 20s18-9 18-21z';

/** Crânio de óculos cromados. O brilho (.rv-glow) fica atrás das lentes e cresce com o Medo. */
const SKULL_SVG = `
<svg viewBox="0 0 120 130" aria-hidden="true">
  <defs>
    <linearGradient id="rv-chrome" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff"/><stop offset="0.45" stop-color="#9a9ab4"/>
      <stop offset="0.55" stop-color="#2c2c40"/><stop offset="1" stop-color="#d6d6f0"/>
    </linearGradient>
    <linearGradient id="rv-lens" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#e8e8ff"/><stop offset="0.35" stop-color="#5a5a78"/><stop offset="1" stop-color="#15151f"/>
    </linearGradient>
    <radialGradient id="rv-glow">
      <stop offset="0" stop-color="#ffffff"/><stop class="rv-glow-stop" offset="0.4"/>
      <stop class="rv-glow-stop" offset="1" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <path class="rv-bone" d="M60 8C28 8 10 30 10 58c0 18 8 30 20 36v18c0 6 4 10 10 10h40c6 0 10-4 10-10V94c12-6 20-18 20-36C110 30 92 8 60 8z"/>
  <path class="rv-hollow" d="M60 82l-7 14h14z"/>
  <path class="rv-teeth" d="M48 108v14M60 108v14M72 108v14"/>
  <ellipse class="rv-glow" cx="38" cy="64" fill="url(#rv-glow)"/>
  <ellipse class="rv-glow" cx="82" cy="64" fill="url(#rv-glow)"/>
  <path d="${LENSES}" fill="url(#rv-lens)" stroke="url(#rv-chrome)" stroke-width="3"/>
  <path class="rv-tint" d="${LENSES}"/>
  <path d="M56 57h8M20 57L7 53M100 57l13-4" fill="none" stroke="url(#rv-chrome)" stroke-width="4" stroke-linecap="round"/>
  <text class="rv-number" x="60" y="44" text-anchor="middle"></text>
</svg>`;

let element = null;
let adversaryElement = null;

function setting(key, fallback) {
  try {
    return game.settings.get(MODULE_ID, key);
  } catch {
    return fallback;
  }
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function icon(name) {
  const node = el('i', `fa-solid ${name}`);
  node.setAttribute('aria-hidden', 'true');
  return node;
}

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
  if (!fear) return;

  const label = `${game.i18n.localize('RUPTURA.Vitals.Fear')} ${fear.value} / ${fear.max}`;
  box.setAttribute('role', 'img');
  box.setAttribute('aria-label', label);
  if (!game.user.isGM) box.title = label;

  const ratio = fear.value / fear.max;
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

  item.append(open, resources);
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

function place(target, left, top) {
  const maxLeft = Math.max(0, window.innerWidth - target.offsetWidth);
  const maxTop = Math.max(0, window.innerHeight - 40);
  target.style.left = `${Math.min(Math.max(0, left), maxLeft)}px`;
  target.style.top = `${Math.min(Math.max(0, top), maxTop)}px`;
}

/** Arrasta `target` pelo `handle` e grava a posição final com `save`. */
function enableDrag(target, handle, save) {
  handle.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || event.target.closest('button')) return;
    const rect = target.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;
    handle.setPointerCapture(event.pointerId);

    const move = (ev) => place(target, ev.clientX - offsetX, ev.clientY - offsetY);
    const stop = () => {
      handle.removeEventListener('pointermove', move);
      handle.removeEventListener('pointerup', stop);
      handle.removeEventListener('pointercancel', stop);
      const end = target.getBoundingClientRect();
      save({ left: Math.round(end.left), top: Math.round(end.top) });
    };
    handle.addEventListener('pointermove', move);
    handle.addEventListener('pointerup', stop);
    handle.addEventListener('pointercancel', stop);
  });
}

/** Cabeçalho de painel: título, botão de recolher e alça de arrasto. */
function buildHeader(target, titleKey, save) {
  const header = el('header', 'rv-header');
  header.append(el('h3', 'rv-title', game.i18n.localize(titleKey)));
  const toggle = el('button', 'rv-toggle');
  toggle.type = 'button';
  toggle.setAttribute('aria-label', game.i18n.localize('RUPTURA.Vitals.Toggle'));
  toggle.title = game.i18n.localize('RUPTURA.Vitals.Toggle');
  toggle.append(icon('fa-chevron-up'));
  toggle.addEventListener('click', () => save({ collapsed: target.classList.toggle('collapsed') }));
  header.append(toggle);
  enableDrag(target, header, save);
  return header;
}

/** Mestre: Vigília com o Medo no topo e os vitais de cada personagem. */
function mountGM(state) {
  element.classList.toggle('collapsed', !!state.collapsed);
  element.append(buildHeader(element, 'RUPTURA.Vitals.Title', saveState));
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
    return;
  }

  const state = (setting('vitalsState', {}) ?? {}).adversaries ?? {};
  adversaryElement = el('aside', 'ruptura-vitals rv-adversaries');
  adversaryElement.id = ADVERSARY_ELEMENT_ID;
  adversaryElement.setAttribute('aria-label', game.i18n.localize('RUPTURA.Vitals.Adversaries'));
  adversaryElement.classList.toggle('collapsed', !!state.collapsed);
  const list = el('ul', 'rv-list');
  list.append(...rows);
  adversaryElement.append(buildHeader(adversaryElement, 'RUPTURA.Vitals.Adversaries', saveAdversaryState), list);
  document.body.append(adversaryElement);
  place(adversaryElement, state.left ?? 400, state.top ?? 80);
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
  if (isGM) mountGM(state);
  else mountPlayer();
  document.body.append(element);

  renderFear();
  renderList();
  place(element, state.left ?? 130, state.top ?? 80);
  renderAdversaries();
}

function unmount() {
  unmountAdversaries();
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
  Hooks.on('ruptura.themeApplied', syncVitalsWidget);
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
