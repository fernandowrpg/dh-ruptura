// Encaixe dos Sigilos: uma tela com um encaixe por andar da Esfera.
// As runas são os itens criados pelo Sigil Generator (módulo sigil-generator).
// Qualquer jogador encaixa uma runa que esteja no inventário de um personagem seu:
// o pedido vai ao mestre pelo socket, que grava o encaixe e tira a runa do inventário.
// O mestre pode retirar uma runa (ela volta para quem a encaixou) e decide quando
// o grupo percebe o que está no fundo da tela (scripts/widgets/mind.mjs).
import { MODULE_ID, getVariants, resolveActiveTheme, resolveActiveVariant } from '../theme-manager.mjs';
import { el, icon, iconButton, setting } from './ui.mjs';
import { SOCKET_RADIUS, VIEW, mindSvg, slotAngle } from './mind.mjs';
import { hideDockIcon, isDocked, setDockBadge, showDockIcon } from './dock.mjs';

export const WIDGET_ID = 'sigils';
const SETTING = 'sigils';
const REVEAL = 'sigilsRevealed';
const SIGIL_MODULE = 'sigil-generator';
const SOCKET = `module.${MODULE_ID}`;
const RUNE_IMG = /runa-(\d+)\.png/;
const REVEAL_MS = 3200;

const t = (key, data) => (data
  ? game.i18n.format(`RUPTURA.Sigils.${key}`, data)
  : game.i18n.localize(`RUPTURA.Sigils.${key}`));

function escape(text) {
  const span = document.createElement('span');
  span.textContent = String(text ?? '');
  return span.innerHTML;
}

/** URL absoluta da imagem, para usar em `mask-image` sem depender de onde o CSS está. */
function absolute(path) {
  try {
    return new URL(path, document.baseURI).href;
  } catch {
    return path;
  }
}

/** `mask-image` da runa. Aspas simples: o resultado também vai dentro de `style="…"`. */
function maskStyle(img) {
  const safe = absolute(img).replace(/["'\\]/g, (c) => (c === '"' ? '%22' : `\\${c}`));
  const url = `url('${safe}')`;
  return `-webkit-mask-image:${url};mask-image:${url}`;
}

/* ---------- Dados ---------- */

/** Um encaixe por andar que declara um sigilo, em ordem de andar. */
export function getSlots() {
  return getVariants()
    .filter((variant) => variant.sigil && variant.floor)
    .sort((a, b) => a.floor - b.floor);
}

/** Runas encaixadas, por id do andar. */
export function getPlaced() {
  const value = setting(SETTING, {});
  return value && typeof value === 'object' && !Array.isArray(value) ? foundry.utils.deepClone(value) : {};
}

export function isRevealed() {
  return !!setting(REVEAL, false);
}

function slotFor(floor) {
  return getSlots().find((slot) => slot.id === floor) ?? null;
}

/** O jogador já chegou a este andar? Antes disso, o encaixe não diz de onde é. */
function reached(slot, placed = getPlaced()) {
  if (game.user.isGM || placed[slot.id]) return true;
  return slot.floor <= (resolveActiveVariant()?.floor ?? 0);
}

/** Item criado pelo Sigil Generator: tem as flags dele ou a imagem `runa-<semente>.png`. */
export function isRune(item) {
  if (item?.documentName !== 'Item') return false;
  const flags = item.flags?.[SIGIL_MODULE];
  if (flags && (flags.journalUuid || flags.journalId || flags.seed != null)) return true;
  return RUNE_IMG.test(item.img ?? '');
}

function runeInfo(item) {
  const flags = item.flags?.[SIGIL_MODULE] ?? {};
  const match = String(item.img ?? '').match(RUNE_IMG);
  return {
    seed: flags.seed ?? (match ? Number(match[1]) : null),
    journalUuid: flags.journalUuid ?? (flags.journalId ? `JournalEntry.${flags.journalId}` : null)
  };
}

/** Por que esta runa não pode ir para este encaixe (ou `null`, se pode). */
function problemWith(floor, item, user) {
  const placed = getPlaced();
  if (!slotFor(floor)) return { key: 'NoSlot' };
  if (placed[floor]) return { key: 'Occupied' };
  if (!item) return { key: 'NoItem' };
  if (!isRune(item)) return { key: 'NotRune' };
  if (!user?.isGM && !(item.isEmbedded && item.testUserPermission(user, 'OWNER'))) return { key: 'NotOwner' };
  const { seed, journalUuid } = runeInfo(item);
  const twin = Object.entries(placed).find(([, entry]) =>
    (seed != null && entry.seed === seed) || (journalUuid && entry.journalUuid === journalUuid));
  if (twin) return { key: 'AlreadyPlaced', data: { floor: slotFor(twin[0])?.floor ?? '?' } };
  return null;
}

function warn(problem) {
  if (problem) ui.notifications.warn(t(`Problem.${problem.key}`, problem.data));
}

/* ---------- Gravação (só o mestre) ---------- */

let queue = Promise.resolve();

/** Os pedidos de encaixe passam um de cada vez, para dois jogadores não brigarem pelo mesmo. */
function enqueue(task) {
  const run = queue.then(task, task);
  queue = run.catch(() => null);
  return run;
}

async function doPlace(floor, itemUuid, userId) {
  const user = game.users.get(userId) ?? game.user;
  const item = await fromUuid(itemUuid);
  const problem = problemWith(floor, item, user);
  if (problem) return problem;

  const actor = item.isEmbedded && item.parent?.documentName === 'Actor' ? item.parent : null;
  const placed = getPlaced();
  placed[floor] = {
    name: item.name,
    img: item.img,
    ...runeInfo(item),
    // Só guarda o item quando ele sai de um inventário: é o que volta ao retirar.
    item: actor ? item.toObject() : null,
    actorUuid: actor?.uuid ?? null,
    actorName: actor?.name ?? null,
    userId: user.id,
    userName: user.name,
    placedAt: Date.now()
  };
  await game.settings.set(MODULE_ID, SETTING, placed);
  if (actor) await item.delete();
  announcePlaced(floor, placed[floor]);
  return null;
}

function announcePlaced(floor, entry) {
  const slot = slotFor(floor);
  const text = t('ChatPlaced', { rune: `<strong>${escape(entry.name)}</strong>`, floor: slot?.floor ?? '?' });
  ChatMessage.create({
    speaker: { alias: entry.actorName ?? entry.userName ?? t('Title') },
    content: `<div class="ruptura-sigil-chat" style="--rsc-color:${slot?.color ?? 'currentColor'}">`
      + `<span class="rsc-glow"><span class="rsc-rune" style="${maskStyle(entry.img)}"></span></span><p>${text}</p></div>`
  });
}

/** Encaixa uma runa. O mestre grava direto; o jogador pede ao mestre. */
export async function placeRune(floor, itemUuid) {
  const item = await fromUuid(itemUuid);
  const problem = problemWith(floor, item, game.user);
  if (problem) return warn(problem);
  if (game.user.isGM) return warn(await enqueue(() => doPlace(floor, itemUuid, game.user.id)));
  if (!game.users.activeGM) return warn({ key: 'NeedGM' });
  game.socket.emit(SOCKET, { type: 'place', floor, itemUuid, userId: game.user.id });
}

/** Retira a runa do encaixe; ela volta para o personagem que a encaixou (ou para o diretório). */
export async function removeRune(floor, { confirm = true } = {}) {
  if (!game.user.isGM) return;
  const placed = getPlaced();
  const entry = placed[floor];
  if (!entry) return;
  const actor = entry.actorUuid ? await fromUuid(entry.actorUuid) : null;

  if (confirm) {
    const target = entry.item ? (actor?.name ?? t('ToDirectory')) : null;
    const yes = await foundry.applications.api.DialogV2.confirm({
      window: { title: t('Remove'), icon: 'fa-solid fa-hand' },
      content: `<p>${t(target ? 'RemoveConfirm' : 'RemoveConfirmKeep', {
        name: `<strong>${escape(entry.name)}</strong>`,
        floor: slotFor(floor)?.floor ?? '?',
        target: escape(target)
      })}</p>`,
      rejectClose: false
    });
    if (!yes) return;
  }

  if (entry.item) {
    if (actor) await actor.createEmbeddedDocuments('Item', [entry.item]);
    else await Item.implementation.create(entry.item);
  }
  delete placed[floor];
  await game.settings.set(MODULE_ID, SETTING, placed);
}

/** O mestre decide quando o grupo percebe o que está no fundo da tela. */
export async function setRevealed(value = true) {
  if (!game.user.isGM) return;
  await game.settings.set(MODULE_ID, REVEAL, !!value);
}

/** Abre a tela para todos os conectados. */
export function showToAll() {
  if (!game.user.isGM) return;
  game.socket.emit(SOCKET, { type: 'open' });
  openSigils();
}

function onSocket(message) {
  switch (message?.type) {
    case 'place':
      if (!game.users.activeGM?.isSelf) return;
      enqueue(() => doPlace(message.floor, message.itemUuid, message.userId)).then((problem) => {
        if (problem) game.socket.emit(SOCKET, { type: 'rejected', userId: message.userId, problem });
      });
      break;
    case 'rejected':
      if (message.userId === game.user.id) warn(message.problem);
      break;
    case 'open':
      openSigils();
      break;
  }
}

/* ---------- Escolher uma runa ---------- */

/** Runas que este usuário pode encaixar: inventário dos seus personagens (e o diretório, para o mestre). */
function candidateRunes() {
  const placed = Object.values(getPlaced());
  const used = (item) => {
    const { seed, journalUuid } = runeInfo(item);
    return placed.some((entry) => (seed != null && entry.seed === seed) || (journalUuid && entry.journalUuid === journalUuid));
  };
  const list = [];
  for (const actor of game.actors) {
    if (!actor.isOwner || (game.user.isGM && !actor.hasPlayerOwner)) continue;
    for (const item of actor.items) if (isRune(item) && !used(item)) list.push({ item, owner: actor.name });
  }
  if (game.user.isGM) {
    for (const item of game.items) if (isRune(item) && !used(item)) list.push({ item, owner: t('Directory') });
  }
  return list;
}

async function pickRune(slot) {
  const runes = candidateRunes();
  if (!runes.length) return ui.notifications.warn(t('NoRunes'));

  const options = runes.map(({ item, owner }, i) => `
    <li><label class="rsp-option">
      <input type="radio" name="rune" value="${escape(item.uuid)}"${i === 0 ? ' checked' : ''}>
      <span class="rsp-glow"><span class="rsp-rune" style="${maskStyle(item.img)}"></span></span>
      <span class="rsp-text"><span class="rsp-name">${escape(item.name)}</span><span class="rsp-owner">${escape(owner)}</span></span>
    </label></li>`).join('');

  const uuid = await foundry.applications.api.DialogV2.prompt({
    window: { title: t('Pick'), icon: 'fa-solid fa-circle-nodes' },
    classes: ['ruptura-sigil-picker'],
    content: `<p class="rsp-hint">${t('PickHint', { floor: slot.floor })}</p><ul class="rsp-list" style="--rs-floor:${slot.color}">${options}</ul>`,
    ok: {
      label: t('PickButton'),
      icon: 'fa-solid fa-check',
      callback: (_event, button) => button.form.elements.rune?.value ?? null
    },
    rejectClose: false
  });
  if (uuid) placeRune(slot.id, uuid);
}

async function openJournal(entry) {
  const journal = entry.journalUuid ? await fromUuid(entry.journalUuid) : null;
  if (!journal) return ui.notifications.warn(t('Problem.NoJournal'));
  if (!journal.testUserPermission(game.user, 'OBSERVER')) return ui.notifications.warn(t('Problem.NoPermission'));
  journal.sheet.render(true);
}

function dragData(event) {
  const editor = foundry.applications?.ux?.TextEditor?.implementation ?? globalThis.TextEditor;
  try {
    return editor.getDragEventData(event);
  } catch {
    try {
      return JSON.parse(event.dataTransfer.getData('text/plain'));
    } catch {
      return null;
    }
  }
}

/* ---------- Janela ---------- */

const { ApplicationV2 } = foundry.applications.api;

class SigilBoard extends ApplicationV2 {
  static DEFAULT_OPTIONS = {
    id: 'ruptura-sigils',
    classes: ['ruptura-sigils'],
    window: { title: 'RUPTURA.Sigils.Title', icon: 'fa-solid fa-circle-nodes', resizable: false },
    position: { width: 620, height: 'auto' },
    actions: { rupturaDock: SigilBoard.#onDock }
  };

  /** Andares preenchidos no último desenho, para animar só o encaixe novo. */
  #known = null;

  async _renderFrame(options) {
    const frame = await super._renderFrame(options);
    const close = frame.querySelector('.window-header [data-action="close"]');
    if (close) {
      const label = game.i18n.localize('RUPTURA.Dock.Minimize');
      const button = el('button', 'header-control icon fa-solid fa-minus');
      button.type = 'button';
      button.dataset.action = 'rupturaDock';
      button.dataset.tooltip = label;
      button.setAttribute('aria-label', label);
      close.before(button);
    }
    return frame;
  }

  async _renderHTML() {
    return this.#build();
  }

  _replaceHTML(result, content) {
    content.replaceChildren(result);
  }

  _onClose(options) {
    super._onClose?.(options);
    this.#known = null;
    hideDockIcon(WIDGET_ID);
  }

  static #onDock() {
    this.minimize();
  }

  /** Minimizar (botão ou clique duplo no título) esconde a janela e deixa o ícone flutuante. */
  async minimize() {
    if (!this.element || isDocked(WIDGET_ID)) return;
    const rect = this.element.getBoundingClientRect();
    this.element.classList.add('ruptura-docked');
    showDockIcon(WIDGET_ID, {
      label: t('Title'),
      icon: 'fa-circle-nodes',
      badge: this.#tally(),
      from: { left: rect.left, top: rect.top },
      onRestore: () => this.maximize()
    });
  }

  async maximize() {
    hideDockIcon(WIDGET_ID);
    this.element?.classList.remove('ruptura-docked');
    this.bringToFront?.();
  }

  #tally() {
    const placed = getPlaced();
    return getSlots().filter((slot) => placed[slot.id]).length;
  }

  #build() {
    const slots = getSlots();
    const placed = getPlaced();
    const filled = slots.filter((slot) => placed[slot.id]).map((slot) => slot.id);
    const fresh = new Set(this.#known ? filled.filter((id) => !this.#known.has(id)) : []);
    this.#known = new Set(filled);

    const root = el('div', 'rs-board');
    const stage = el('div', 'rs-stage');
    stage.classList.toggle('rs-revealed', isRevealed());
    stage.classList.toggle('rs-complete', slots.length > 0 && filled.length === slots.length);
    stage.innerHTML = mindSvg(slots.map(({ id, color }) => ({ id, color })));
    for (const id of filled) {
      stage.querySelectorAll(`[data-floor="${id}"]`).forEach((node) => {
        node.classList.add('rs-set');
        if (fresh.has(id)) node.classList.add('rs-fresh');
      });
    }

    if (slots.length === 12) stage.append(el('span', 'rs-arc rs-arc-1', t('ArcOne')), el('span', 'rs-arc rs-arc-2', t('ArcTwo')));
    slots.forEach((slot, i) => stage.append(this.#socket(slot, i, slots.length, placed, fresh.has(slot.id))));

    setDockBadge(WIDGET_ID, filled.length);
    const info = el('div', 'rs-info');
    info.setAttribute('aria-live', 'polite');
    root.append(stage, info, this.#footer(filled.length, slots.length));
    this.#describe(info, null);
    return root;
  }

  #socket(slot, index, total, placed, fresh) {
    const entry = placed[slot.id];
    const known = reached(slot, placed);
    const angle = (slotAngle(index, total) * Math.PI) / 180;
    const radius = (SOCKET_RADIUS / VIEW) * 100;

    const wrap = el('div', 'rs-socket');
    wrap.dataset.floor = slot.id;
    wrap.style.left = `${50 + radius * Math.cos(angle)}%`;
    wrap.style.top = `${50 + radius * Math.sin(angle)}%`;
    wrap.style.setProperty('--rs-floor', slot.color);
    wrap.classList.toggle('rs-filled', !!entry);
    wrap.classList.toggle('rs-fresh', fresh);
    wrap.classList.toggle('rs-unknown', !known);

    const well = el('button', 'rs-well');
    well.type = 'button';
    const floorLabel = game.i18n.format('RUPTURA.Sigils.Floor', { floor: slot.floor });
    well.setAttribute('aria-label', entry ? `${floorLabel}: ${entry.name}` : `${floorLabel}: ${t('Empty')}`);
    if (entry) {
      // O brilho fica num invólucro: no próprio elemento, a máscara cortaria a sombra.
      const glow = el('span', 'rs-rune-glow');
      const rune = el('span', 'rs-rune');
      rune.setAttribute('style', maskStyle(entry.img));
      glow.append(rune);
      well.append(glow);
    } else if (known && slot.icon) {
      well.append(icon(`${slot.icon} rs-floor-icon`));
    }
    well.addEventListener('click', () => (entry ? openJournal(entry) : pickRune(slot)));
    wrap.append(well, el('span', 'rs-num', String(slot.floor)));

    if (entry && game.user.isGM) {
      wrap.append(iconButton('rs-remove', 'fa-xmark', t('Remove'), () => removeRune(slot.id)));
    }

    if (!entry) {
      wrap.addEventListener('dragover', (event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        wrap.classList.add('rs-over');
      });
      wrap.addEventListener('dragleave', () => wrap.classList.remove('rs-over'));
      wrap.addEventListener('drop', (event) => {
        event.preventDefault();
        wrap.classList.remove('rs-over');
        const data = dragData(event);
        if (data?.type !== 'Item' || !data.uuid) return warn({ key: 'NotRune' });
        placeRune(slot.id, data.uuid);
      });
    }

    const show = () => this.#describe(this.element?.querySelector('.rs-info'), slot);
    const hide = () => this.#describe(this.element?.querySelector('.rs-info'), null);
    wrap.addEventListener('pointerenter', show);
    wrap.addEventListener('pointerleave', hide);
    wrap.addEventListener('focusin', show);
    wrap.addEventListener('focusout', hide);
    return wrap;
  }

  /** Painel abaixo do anel: o que é o encaixe sob o cursor, ou como usar a tela. */
  #describe(info, slot) {
    if (!info) return;
    if (!slot) {
      info.style.removeProperty('--rs-floor');
      info.replaceChildren(el('p', 'rs-info-hint', t('Hint')));
      return;
    }
    const placed = getPlaced();
    const entry = placed[slot.id];
    const known = reached(slot, placed);
    const floorLabel = game.i18n.format('RUPTURA.Sigils.Floor', { floor: slot.floor });
    info.style.setProperty('--rs-floor', slot.color);

    const head = el('p', 'rs-info-head');
    head.append(el('span', 'rs-info-floor', floorLabel));
    if (known) head.append(el('span', 'rs-info-title', game.i18n.localize(slot.title ?? slot.label)));
    const lines = [head];

    if (entry) {
      lines.push(el('p', 'rs-info-rune', entry.name));
      const by = entry.actorName
        ? t('PlacedByActor', { user: entry.userName ?? '?', actor: entry.actorName })
        : t('PlacedBy', { user: entry.userName ?? '?' });
      lines.push(el('p', 'rs-info-meta', by));
    } else {
      lines.push(el('p', 'rs-info-meta', known ? t('EmptyHint') : t('Unreached')));
    }
    if (game.user.isGM) {
      lines.push(el('p', 'rs-info-gm', t('GmLine', {
        sigil: game.i18n.localize(slot.sigil),
        bond: game.i18n.localize(slot.bond)
      })));
    }
    info.replaceChildren(...lines);
  }

  #footer(count, total) {
    const footer = el('footer', 'rs-footer');
    const tally = el('p', 'rs-tally');
    tally.append(el('strong', null, `${count} / ${total}`), el('span', null, t('Tally')));
    footer.append(tally);

    if (game.user.isGM) {
      const revealed = isRevealed();
      const reveal = el('button', 'rs-btn rs-reveal');
      reveal.type = 'button';
      reveal.setAttribute('aria-pressed', String(revealed));
      reveal.append(icon(revealed ? 'fa-eye-slash' : 'fa-eye'), el('span', null, t(revealed ? 'Veil' : 'Reveal')));
      reveal.title = t(revealed ? 'VeilHint' : 'RevealHint');
      reveal.addEventListener('click', () => setRevealed(!isRevealed()));

      const all = el('button', 'rs-btn rs-show-all');
      all.type = 'button';
      all.append(icon('fa-users'), el('span', null, t('ShowAll')));
      all.title = t('ShowAllHint');
      all.addEventListener('click', showToAll);
      footer.append(reveal, all);
    }
    return footer;
  }

  /** A revelação muda no lugar, para a transição do véu acontecer na frente de todos. */
  applyReveal(value) {
    const stage = this.element?.querySelector('.rs-stage');
    if (!stage) return;
    if (value && !stage.classList.contains('rs-revealed')) {
      stage.classList.add('rs-revealing');
      setTimeout(() => stage.classList.remove('rs-revealing'), REVEAL_MS);
    }
    stage.classList.toggle('rs-revealed', !!value);
    const old = this.element.querySelector('.rs-footer');
    if (old) {
      const slots = getSlots();
      const placed = getPlaced();
      old.replaceWith(this.#footer(slots.filter((slot) => placed[slot.id]).length, slots.length));
    }
  }
}

let board = null;

export function openSigils() {
  if (!getSlots().length) return null;
  board ??= new SigilBoard();
  if (isDocked(WIDGET_ID)) board.maximize();
  board.render({ force: true });
  board.bringToFront?.();
  return board;
}

/* ---------- Registro ---------- */

function enabled() {
  return !!resolveActiveTheme()?.widgets?.includes(WIDGET_ID) && getSlots().length > 0;
}

let controlShown = null;

export function registerSigils() {
  Hooks.once('ready', () => game.socket.on(SOCKET, onSocket));

  // Botão nos controles de token, para todos, enquanto o tema tiver a tela.
  Hooks.on('getSceneControlButtons', (controls) => {
    controlShown = enabled();
    if (!controlShown) return;
    const tokens = controls.tokens ?? controls.token;
    if (!tokens?.tools) return;
    tokens.tools.rupturaSigils = {
      name: 'rupturaSigils',
      title: 'RUPTURA.Sigils.Open',
      icon: 'fa-solid fa-circle-nodes',
      order: Object.keys(tokens.tools).length,
      button: true,
      visible: true,
      onChange: () => openSigils()
    };
  });

  Hooks.on('ruptura.themeApplied', () => {
    if (!game.ready) return;
    if (controlShown !== null && controlShown !== enabled()) ui.controls?.render({ reset: true });
    if (board?.rendered) board.render();
  });

  const onSetting = (document) => {
    if (!board?.rendered) return;
    if (document?.key === `${MODULE_ID}.${SETTING}`) board.render();
    if (document?.key === `${MODULE_ID}.${REVEAL}`) board.applyReveal(isRevealed());
  };
  Hooks.on('createSetting', onSetting);
  Hooks.on('updateSetting', onSetting);
}

/** API para macros: `game.modules.get('dh-ruptura').api.sigils`. */
export const sigilsApi = {
  open: openSigils,
  showToAll,
  list: getPlaced,
  place: placeRune,
  remove: removeRune,
  reveal: (value = true) => setRevealed(value),
  isRevealed
};
