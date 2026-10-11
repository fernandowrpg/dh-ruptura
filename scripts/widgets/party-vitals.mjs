import { MODULE_ID, resolveActiveTheme } from '../theme-manager.mjs';

export const WIDGET_ID = 'party-vitals';
const ELEMENT_ID = 'ruptura-vitals';
const MAX_PIPS = 12;

/** Recursos do Daggerheart exibidos, na ordem. `marked`: o valor conta espaços marcados. */
const RESOURCES = [
  { key: 'hitPoints', icon: 'fa-heart', label: 'RUPTURA.Vitals.HitPoints', marked: true },
  { key: 'armor', icon: 'fa-shield-halved', label: 'RUPTURA.Vitals.Armor', marked: true },
  { key: 'hope', icon: 'fa-sun', label: 'RUPTURA.Vitals.Hope', marked: false },
  { key: 'stress', icon: 'fa-bolt', label: 'RUPTURA.Vitals.Stress', marked: true }
];

let element = null;

function setting(key, fallback) {
  try {
    return game.settings.get(MODULE_ID, key);
  } catch {
    return fallback;
  }
}

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

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function buildResource(actor, def) {
  const label = game.i18n.localize(def.label);
  const data = readResource(actor, def.key);
  const row = el('div', `rv-resource rv-${def.key}`);

  const icon = el('i', `fa-solid ${def.icon}`);
  icon.setAttribute('aria-hidden', 'true');
  row.append(icon);

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

function buildCharacter(actor) {
  const item = el('li', 'rv-character');

  const open = el('button', 'rv-open');
  open.type = 'button';
  open.title = game.i18n.format('RUPTURA.Vitals.OpenSheet', { name: actor.name });
  open.addEventListener('click', () => actor.sheet?.render(true));
  const portrait = el('img', 'rv-portrait');
  portrait.src = actor.img;
  portrait.alt = '';
  open.append(portrait, el('span', 'rv-name', actor.name));

  const resources = el('div', 'rv-resources');
  for (const def of RESOURCES) resources.append(buildResource(actor, def));

  item.append(open, resources);
  return item;
}

function render() {
  if (!element) return;
  const list = element.querySelector('.rv-list');
  const characters = partyCharacters();
  if (characters.length) list.replaceChildren(...characters.map(buildCharacter));
  else list.replaceChildren(el('li', 'rv-none', game.i18n.localize('RUPTURA.Vitals.Empty')));
}

const refresh = foundry.utils.debounce(render, 50);

function saveState(patch) {
  const state = { ...(setting('vitalsState', {}) ?? {}), ...patch };
  game.settings.set(MODULE_ID, 'vitalsState', state);
}

function place(left, top) {
  const maxLeft = Math.max(0, window.innerWidth - element.offsetWidth);
  const maxTop = Math.max(0, window.innerHeight - 40);
  element.style.left = `${Math.min(Math.max(0, left), maxLeft)}px`;
  element.style.top = `${Math.min(Math.max(0, top), maxTop)}px`;
}

function enableDrag(handle) {
  handle.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || event.target.closest('button')) return;
    const rect = element.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;
    handle.setPointerCapture(event.pointerId);

    const move = (ev) => place(ev.clientX - offsetX, ev.clientY - offsetY);
    const stop = () => {
      handle.removeEventListener('pointermove', move);
      handle.removeEventListener('pointerup', stop);
      handle.removeEventListener('pointercancel', stop);
      const end = element.getBoundingClientRect();
      saveState({ left: Math.round(end.left), top: Math.round(end.top) });
    };
    handle.addEventListener('pointermove', move);
    handle.addEventListener('pointerup', stop);
    handle.addEventListener('pointercancel', stop);
  });
}

function mount() {
  if (element) return;
  const state = setting('vitalsState', {}) ?? {};

  element = el('aside', 'ruptura-vitals');
  element.id = ELEMENT_ID;
  element.setAttribute('aria-label', game.i18n.localize('RUPTURA.Vitals.Title'));
  element.classList.toggle('collapsed', !!state.collapsed);

  const header = el('header', 'rv-header');
  header.append(el('h3', 'rv-title', game.i18n.localize('RUPTURA.Vitals.Title')));
  const toggle = el('button', 'rv-toggle');
  toggle.type = 'button';
  toggle.setAttribute('aria-label', game.i18n.localize('RUPTURA.Vitals.Toggle'));
  toggle.title = game.i18n.localize('RUPTURA.Vitals.Toggle');
  const chevron = el('i', 'fa-solid fa-chevron-up');
  chevron.setAttribute('aria-hidden', 'true');
  toggle.append(chevron);
  toggle.addEventListener('click', () => {
    const collapsed = element.classList.toggle('collapsed');
    saveState({ collapsed });
  });
  header.append(toggle);

  element.append(header, el('ul', 'rv-list'));
  document.body.append(element);

  enableDrag(header);
  render();
  place(state.left ?? 130, state.top ?? 80);
}

function unmount() {
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

  // Qualquer mudança que possa afetar os recursos redesenha o painel.
  const events = [
    'createActor', 'updateActor', 'deleteActor',
    'createItem', 'updateItem', 'deleteItem',
    'createActiveEffect', 'updateActiveEffect', 'deleteActiveEffect',
    'updateUser'
  ];
  for (const event of events) Hooks.on(event, () => refresh());
}
