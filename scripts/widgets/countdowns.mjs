// Ampulhetas: contadores da aventura numa janela flutuante, no estilo da Vigília.
// Cada ampulheta tem um número de passos; a areia desce um passo por vez.
// O mestre cria, edita e anda com elas; os jogadores veem só as marcadas como visíveis.
import { MODULE_ID, getVariants, resolveActiveTheme, resolveActiveVariant } from '../theme-manager.mjs';
import { buildHeader, el, icon, iconButton, place, setting } from './ui.mjs';

export const WIDGET_ID = 'countdowns';
const ELEMENT_ID = 'ruptura-countdowns';
const SETTING = 'countdowns';
const MAX_STEPS = 20;
const FLIP_MS = 700;

/** O que faz a areia descer. */
export const TRIGGERS = ['test', 'fail', 'attack', 'spotlight', 'custom'];

let element = null;
/** Último valor desenhado de cada ampulheta, para animar a virada. */
const drawn = new Map();

/* ---------- Dados ---------- */

function clampInt(value, min, max, fallback) {
  const n = Math.round(Number(value));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}

function normalize(data = {}) {
  const max = clampInt(data.max, 1, MAX_STEPS, 4);
  return {
    id: data.id || foundry.utils.randomID(),
    name: String(data.name ?? '').trim() || game.i18n.localize('RUPTURA.Countdowns.Untitled'),
    max,
    value: clampInt(data.value ?? max, 0, max, max),
    trigger: TRIGGERS.includes(data.trigger) ? data.trigger : 'custom',
    loop: !!data.loop,
    visible: !!data.visible,
    effect: String(data.effect ?? '').trim()
  };
}

export function getCountdowns() {
  const list = setting(SETTING, []);
  return Array.isArray(list) ? list.map(normalize) : [];
}

function canEdit() {
  return !!game.user?.isGM;
}

async function save(list) {
  if (!canEdit()) throw new Error(`${MODULE_ID} | só o mestre altera as ampulhetas`);
  return game.settings.set(MODULE_ID, SETTING, list.map(normalize));
}

async function patch(id, change) {
  const list = getCountdowns();
  const index = list.findIndex((item) => item.id === id);
  if (index < 0) return null;
  const before = list[index];
  const next = normalize({ ...before, ...(typeof change === 'function' ? change(before) : change) });
  list[index] = next;
  await save(list);
  if (before.value > 0 && next.value === 0) announceZero(next);
  return next;
}

export async function addCountdown(data) {
  const item = normalize({ ...data, id: undefined });
  await save([...getCountdowns(), item]);
  return item;
}

/** Desce (`delta` negativo) ou devolve passos. */
export function stepCountdown(id, delta = -1) {
  return patch(id, (item) => ({ value: item.value + delta }));
}

/** Vira a ampulheta: volta a areia toda para cima. */
export function resetCountdown(id) {
  return patch(id, (item) => ({ value: item.max }));
}

export async function removeCountdown(id) {
  await save(getCountdowns().filter((item) => item.id !== id));
}

/** Sussurra ao mestre o efeito da ampulheta que acabou de zerar. */
function announceZero(item) {
  const gms = game.users.filter((user) => user.isGM).map((user) => user.id);
  const effect = item.effect ? `<p>${escape(item.effect)}</p>` : '';
  const loop = item.loop ? `<p><em>${game.i18n.localize('RUPTURA.Countdowns.LoopHint')}</em></p>` : '';
  ChatMessage.create({
    speaker: { alias: game.i18n.localize('RUPTURA.Countdowns.Title') },
    whisper: gms,
    content: `<h3><i class="fa-solid fa-hourglass-end"></i> ${escape(item.name)}</h3>${effect}${loop}`
  });
}

function escape(text) {
  const span = document.createElement('span');
  span.textContent = text;
  return span.innerHTML;
}

/* ---------- Predefinições dos andares ---------- */

/** Contagens declaradas pelas variantes do tema ativo, o andar ativo primeiro. */
function presetGroups() {
  const theme = resolveActiveTheme();
  const active = resolveActiveVariant(theme)?.id;
  return getVariants()
    .filter((variant) => variant.theme === theme?.id && variant.countdowns?.length)
    .sort((a, b) => (b.id === active) - (a.id === active))
    .map((variant) => ({ variant, presets: variant.countdowns }));
}

function localizePreset(preset) {
  return {
    ...preset,
    name: game.i18n.localize(preset.name),
    effect: preset.effect ? game.i18n.localize(preset.effect) : ''
  };
}

/* ---------- Formulário ---------- */

function formData(form) {
  const FDE = foundry.applications?.ux?.FormDataExtended ?? globalThis.FormDataExtended;
  return new FDE(form).object;
}

async function openForm(item) {
  const { DialogV2 } = foundry.applications.api;
  const data = item ?? normalize({ name: '', max: 4, trigger: 'test', loop: false, visible: false });
  const t = (key) => game.i18n.localize(`RUPTURA.Countdowns.${key}`);
  const options = TRIGGERS.map((trigger) =>
    `<option value="${trigger}"${trigger === data.trigger ? ' selected' : ''}>${t(`Trigger.${trigger}`)}</option>`
  ).join('');

  const content = `
    <div class="form-group"><label>${t('Field.Name')}</label>
      <div class="form-fields"><input type="text" name="name" value="${escape(item ? data.name : '')}" autofocus></div></div>
    <div class="form-group"><label>${t('Field.Steps')}</label>
      <div class="form-fields"><input type="number" name="max" min="1" max="${MAX_STEPS}" step="1" value="${data.max}"></div></div>
    ${item ? `<div class="form-group"><label>${t('Field.Value')}</label>
      <div class="form-fields"><input type="number" name="value" min="0" max="${MAX_STEPS}" step="1" value="${data.value}"></div></div>` : ''}
    <div class="form-group"><label>${t('Field.Trigger')}</label>
      <div class="form-fields"><select name="trigger">${options}</select></div></div>
    <div class="form-group"><label>${t('Field.Loop')}</label>
      <div class="form-fields"><input type="checkbox" name="loop"${data.loop ? ' checked' : ''}></div></div>
    <div class="form-group"><label>${t('Field.Visible')}</label>
      <div class="form-fields"><input type="checkbox" name="visible"${data.visible ? ' checked' : ''}></div></div>
    <div class="form-group stacked"><label>${t('Field.Effect')}</label>
      <textarea name="effect" rows="3">${escape(data.effect)}</textarea></div>`;

  const result = await DialogV2.prompt({
    window: { title: t(item ? 'Edit' : 'New'), icon: 'fa-solid fa-hourglass-half' },
    classes: ['ruptura-countdown-form'],
    content,
    ok: { label: t(item ? 'Save' : 'Create'), icon: 'fa-solid fa-check', callback: (_event, button) => formData(button.form) },
    rejectClose: false
  });
  if (!result) return;
  if (!item) return addCountdown(result);
  const value = clampInt(result.value, 0, clampInt(result.max, 1, MAX_STEPS, item.max), item.value);
  return patch(item.id, { ...result, value });
}

async function confirmRemove(item) {
  const { DialogV2 } = foundry.applications.api;
  const yes = await DialogV2.confirm({
    window: { title: game.i18n.localize('RUPTURA.Countdowns.Remove') },
    content: `<p>${game.i18n.format('RUPTURA.Countdowns.RemoveConfirm', { name: escape(item.name) })}</p>`,
    rejectClose: false
  });
  if (yes) removeCountdown(item.id);
}

/* ---------- Ampulheta ---------- */

const GLASS = 'M12 12H48C48 30 34 40 31.5 50C34 60 48 70 48 88H12C12 70 26 60 28.5 50C26 40 12 30 12 12Z';

function hourglassSvg(id) {
  const clip = `rc-clip-${id}`;
  return `
<svg viewBox="0 0 60 100" aria-hidden="true">
  <defs><clipPath id="${clip}"><path d="${GLASS}"/></clipPath></defs>
  <path class="rc-glass" d="${GLASS}"/>
  <g clip-path="url(#${clip})">
    <rect class="rc-sand rc-sand-top" x="8" y="12" width="44" height="38"/>
    <rect class="rc-sand rc-sand-bottom" x="8" y="50" width="44" height="38"/>
    <line class="rc-stream" x1="30" y1="49" x2="30" y2="88"/>
  </g>
  <path class="rc-glass-edge" d="${GLASS}"/>
  <path class="rc-frame" d="M6 4h48v8H6zM6 88h48v8H6zM8 12v76M52 12v76"/>
</svg>`;
}

function stepLabel(item) {
  return game.i18n.format('RUPTURA.Countdowns.Remaining', { value: item.value, max: item.max });
}

function buildCard(item) {
  const card = el('li', 'rc-card');
  card.dataset.id = item.id;

  const glass = el('div', 'rc-hourglass');
  glass.innerHTML = hourglassSvg(item.id);

  const body = el('div', 'rc-body');
  const head = el('div', 'rc-head');
  head.append(el('span', 'rc-name'), el('span', 'rc-count'));
  const meta = el('div', 'rc-meta');
  const pips = el('div', 'rc-pips');
  body.append(head, meta, pips);

  if (canEdit()) {
    body.append(el('p', 'rc-effect'));
    const actions = el('div', 'rc-actions');
    const t = (key) => game.i18n.localize(`RUPTURA.Countdowns.${key}`);
    const id = item.id;
    actions.append(
      iconButton('rc-btn rc-step', 'fa-hourglass-half', t('Step'), () => {
        const current = getCountdowns().find((c) => c.id === id);
        if (current?.value === 0) resetCountdown(id);
        else stepCountdown(id, -1);
      }),
      iconButton('rc-btn rc-back', 'fa-rotate-left', t('Back'), () => stepCountdown(id, 1)),
      iconButton('rc-btn rc-flip', 'fa-arrows-rotate', t('Flip'), () => resetCountdown(id)),
      iconButton('rc-btn rc-eye', 'fa-eye', t('Visible'), () => patch(id, (c) => ({ visible: !c.visible }))),
      iconButton('rc-btn rc-edit', 'fa-pen', t('Edit'), () => {
        const current = getCountdowns().find((c) => c.id === id);
        if (current) openForm(current);
      }),
      iconButton('rc-btn rc-remove', 'fa-trash', t('Remove'), () => {
        const current = getCountdowns().find((c) => c.id === id);
        if (current) confirmRemove(current);
      })
    );
    body.append(actions);
  }

  card.append(glass, body);
  return card;
}

/** Atualiza o cartão no lugar, para a areia escorrer com transição. */
function updateCard(card, item) {
  const ratio = item.value / item.max;
  const empty = item.value === 0;
  const t = (key) => game.i18n.localize(`RUPTURA.Countdowns.${key}`);

  card.classList.toggle('rc-zero', empty);
  card.classList.toggle('rc-hidden', !item.visible);
  card.querySelector('.rc-hourglass').classList.toggle('rc-full', item.value >= item.max);
  card.style.setProperty('--rc-ratio', ratio.toFixed(4));
  card.title = item.effect && canEdit() ? `${item.name}\n${item.effect}` : item.name;
  card.setAttribute('aria-label', `${item.name}: ${stepLabel(item)}`);

  card.querySelector('.rc-name').textContent = item.name;
  card.querySelector('.rc-count').textContent = `${item.value}/${item.max}`;

  const meta = card.querySelector('.rc-meta');
  meta.replaceChildren(el('span', null, t(`Trigger.${item.trigger}`)));
  if (item.loop) meta.append(el('span', 'rc-loop', t('Loop')));
  if (empty) meta.append(el('span', 'rc-zero-tag', t('Zero')));

  const pips = card.querySelector('.rc-pips');
  if (pips.childElementCount !== item.max) {
    pips.replaceChildren(...Array.from({ length: item.max }, (_, i) => {
      const pip = el(canEdit() ? 'button' : 'span', 'rc-pip');
      if (canEdit()) {
        pip.type = 'button';
        pip.addEventListener('click', () => {
          const current = getCountdowns().find((c) => c.id === item.id);
          if (!current) return;
          patch(item.id, { value: current.value === i + 1 ? i : i + 1 });
        });
      }
      return pip;
    }));
  }
  Array.from(pips.children).forEach((pip, i) => {
    pip.classList.toggle('on', i < item.value);
    if (canEdit()) {
      const label = game.i18n.format('RUPTURA.Countdowns.SetSteps', { value: i + 1 });
      pip.title = label;
      pip.setAttribute('aria-label', label);
    }
  });

  const effect = card.querySelector('.rc-effect');
  if (effect) {
    effect.textContent = item.effect;
    effect.hidden = !item.effect;
  }

  const step = card.querySelector('.rc-step');
  if (step) {
    const label = t(empty ? 'Flip' : 'Step');
    step.title = label;
    step.setAttribute('aria-label', label);
    step.querySelector('i').className = `fa-solid ${empty ? 'fa-arrows-rotate' : 'fa-hourglass-half'}`;
  }
  card.querySelector('.rc-back')?.toggleAttribute('disabled', item.value >= item.max);
  const eye = card.querySelector('.rc-eye');
  if (eye) {
    const label = t(item.visible ? 'Visible' : 'HiddenFromPlayers');
    eye.title = label;
    eye.setAttribute('aria-label', label);
    eye.setAttribute('aria-pressed', String(item.visible));
    eye.querySelector('i').className = `fa-solid ${item.visible ? 'fa-eye' : 'fa-eye-slash'}`;
  }

  // Voltou a encher de uma vez: a ampulheta gira.
  const previous = drawn.get(item.id);
  if (previous !== undefined && previous < item.value && item.value === item.max && item.max - previous > 1) {
    const glass = card.querySelector('.rc-hourglass');
    glass.classList.remove('rc-flipping');
    void glass.offsetWidth;
    glass.classList.add('rc-flipping');
    setTimeout(() => glass.classList.remove('rc-flipping'), FLIP_MS);
  }
  drawn.set(item.id, item.value);
}

/* ---------- Janela ---------- */

function visibleCountdowns() {
  const list = getCountdowns();
  return canEdit() ? list : list.filter((item) => item.visible);
}

function saveState(change) {
  game.settings.set(MODULE_ID, 'countdownsState', { ...(setting('countdownsState', {}) ?? {}), ...change });
}

function buildFooter() {
  const footer = el('footer', 'rc-footer');
  const t = (key) => game.i18n.localize(`RUPTURA.Countdowns.${key}`);

  const add = el('button', 'rc-add');
  add.type = 'button';
  add.append(icon('fa-plus'), el('span', null, t('New')));
  add.addEventListener('click', () => openForm(null));

  const select = el('select', 'rc-presets');
  select.setAttribute('aria-label', t('FromFloor'));
  select.addEventListener('change', () => {
    const [variantId, index] = select.value.split(':');
    select.value = '';
    const group = presetGroups().find((g) => g.variant.id === variantId);
    const preset = group?.presets[Number(index)];
    if (preset) addCountdown(localizePreset(preset));
  });

  footer.append(add, select);
  return footer;
}

function renderPresets() {
  const select = element?.querySelector('.rc-presets');
  if (!select) return;
  const groups = presetGroups();
  select.hidden = !groups.length;
  const placeholder = el('option', null, game.i18n.localize('RUPTURA.Countdowns.FromFloor'));
  placeholder.value = '';
  const children = [placeholder];
  for (const { variant, presets } of groups) {
    const group = el('optgroup');
    group.label = game.i18n.localize(variant.label);
    presets.forEach((preset, i) => {
      const option = el('option', null, `${game.i18n.localize(preset.name)} (${preset.max})`);
      option.value = `${variant.id}:${i}`;
      group.append(option);
    });
    children.push(group);
  }
  select.replaceChildren(...children);
  select.value = '';
}

function renderList() {
  if (!element) return;
  const list = element.querySelector('.rv-list');
  const items = visibleCountdowns();
  const cards = new Map(Array.from(list.querySelectorAll('.rc-card'), (card) => [card.dataset.id, card]));

  const nodes = items.map((item) => {
    const card = cards.get(item.id) ?? buildCard(item);
    updateCard(card, item);
    return card;
  });
  for (const id of drawn.keys()) if (!items.some((item) => item.id === id)) drawn.delete(id);
  if (!nodes.length) nodes.push(el('li', 'rv-none', game.i18n.localize('RUPTURA.Countdowns.Empty')));

  // Reaproveita os cartões existentes para não cortar as transições.
  nodes.forEach((node, i) => {
    if (list.children[i] !== node) list.insertBefore(node, list.children[i] ?? null);
  });
  while (list.children.length > nodes.length) list.lastElementChild.remove();
}

function mount() {
  if (element) return;
  const state = setting('countdownsState', {}) ?? {};
  element = el('aside', 'ruptura-vitals ruptura-countdowns');
  element.id = ELEMENT_ID;
  element.setAttribute('aria-label', game.i18n.localize('RUPTURA.Countdowns.Title'));
  element.classList.toggle('collapsed', !!state.collapsed);
  element.classList.toggle('rv-player-view', !canEdit());
  element.append(buildHeader(element, 'RUPTURA.Countdowns.Title', saveState), el('ul', 'rv-list'));
  if (canEdit()) element.append(buildFooter());
  document.body.append(element);
  renderPresets();
  renderList();
  place(element, state.left ?? 400, state.top ?? 420);
}

function unmount() {
  element?.remove();
  element = null;
  drawn.clear();
}

/** Monta ou desmonta a janela conforme o tema, a configuração e o que o usuário pode ver. */
export function syncCountdownsWidget() {
  if (!game.ready) return;
  const theme = resolveActiveTheme();
  const enabled = !!theme?.widgets?.includes(WIDGET_ID) && setting('showCountdowns', true);
  const wanted = enabled && (canEdit() || visibleCountdowns().length > 0);
  if (!wanted) return unmount();
  mount();
  renderList();
}

export function registerCountdownsWidget() {
  Hooks.on('ruptura.themeApplied', () => {
    syncCountdownsWidget();
    renderPresets();
  });
  Hooks.once('ready', syncCountdownsWidget);

  const onSetting = (document) => {
    if (document?.key === `${MODULE_ID}.${SETTING}`) syncCountdownsWidget();
  };
  Hooks.on('createSetting', onSetting);
  Hooks.on('updateSetting', onSetting);
}

/** API para macros: `game.modules.get('dh-ruptura').api.countdowns`. */
export const countdownsApi = {
  list: getCountdowns,
  add: addCountdown,
  step: stepCountdown,
  reset: resetCountdown,
  remove: removeCountdown,
  presets: () => presetGroups().flatMap(({ variant, presets }) =>
    presets.map((preset) => ({ floor: variant.id, ...localizePreset(preset) })))
};
