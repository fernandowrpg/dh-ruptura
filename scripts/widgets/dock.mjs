// Ícones de janela minimizada. Minimizada, cada janela do módulo (Vigília, Inimigos,
// Ampulhetas, Encaixe dos Sigilos) vira um ícone redondo que flutua sobre a cena:
// clique para abrir, arraste para mover, solte perto de um canto para prendê-lo.
// Ícones presos no mesmo canto fazem fila e acompanham o redimensionamento da tela.
import { MODULE_ID } from '../theme-manager.mjs';

const SIZE = 44;
const GAP = 8;
/** Soltar o ícone a esta distância de duas bordas prende-o no canto. */
const MAGNET = 64;
/** Ordem fixa para enfileirar ícones presos no mesmo canto. */
const ORDER = ['vitals', 'adversaries', 'countdowns', 'sigils'];

/** Ícones na tela, por chave. */
const icons = new Map();
/** Posições, lidas da configuração e mantidas aqui para reposicionar sem esperar a gravação. */
let cache = null;

function states() {
  if (!cache) {
    try {
      cache = foundry.utils.deepClone(game.settings.get(MODULE_ID, 'dockState') ?? {});
    } catch {
      cache = {};
    }
  }
  return cache;
}

function saveState(key, patch) {
  const all = states();
  all[key] = { ...(all[key] ?? {}), ...patch };
  game.settings.set(MODULE_ID, 'dockState', foundry.utils.deepClone(all));
}

function clamp(left, top) {
  return {
    left: Math.max(0, Math.min(left, window.innerWidth - SIZE)),
    top: Math.max(0, Math.min(top, window.innerHeight - SIZE))
  };
}

/** Lugar do ícone preso num canto: os do mesmo canto ficam em fila, afastando-se da borda. */
function cornerPosition(key, corner) {
  const neighbours = [...icons.keys()]
    .filter((other) => states()[other]?.corner === corner)
    .sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));
  const step = Math.max(0, neighbours.indexOf(key)) * (SIZE + GAP);
  return {
    left: corner.endsWith('w') ? GAP : window.innerWidth - SIZE - GAP,
    top: corner.startsWith('n') ? GAP + step : window.innerHeight - SIZE - GAP - step
  };
}

/** Canto mais próximo, se o ícone estiver perto de duas bordas. */
function nearCorner(left, top) {
  const cx = left + SIZE / 2;
  const cy = top + SIZE / 2;
  const west = cx < MAGNET;
  const east = cx > window.innerWidth - MAGNET;
  const north = cy < MAGNET;
  const south = cy > window.innerHeight - MAGNET;
  if (!(west || east) || !(north || south)) return null;
  return `${north ? 'n' : 's'}${west ? 'w' : 'e'}`;
}

function position(key) {
  const button = icons.get(key);
  if (!button) return;
  const saved = states()[key] ?? {};
  const target = saved.corner
    ? cornerPosition(key, saved.corner)
    : { left: saved.left ?? button.from?.left ?? 120, top: saved.top ?? button.from?.top ?? 90 };
  const { left, top } = clamp(target.left, target.top);
  button.style.left = `${left}px`;
  button.style.top = `${top}px`;
}

function repositionAll() {
  for (const key of icons.keys()) position(key);
}

function enableDrag(key, button) {
  button.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    const rect = button.getBoundingClientRect();
    const dx = event.clientX - rect.left;
    const dy = event.clientY - rect.top;
    const x0 = event.clientX;
    const y0 = event.clientY;
    button.setPointerCapture(event.pointerId);
    button.dragged = false;

    const move = (ev) => {
      // Uns pixels de tolerância: um clique trêmulo ainda abre a janela.
      if (!button.dragged && Math.hypot(ev.clientX - x0, ev.clientY - y0) < 4) return;
      button.dragged = true;
      button.classList.add('rdi-dragging');
      const { left, top } = clamp(ev.clientX - dx, ev.clientY - dy);
      button.style.left = `${left}px`;
      button.style.top = `${top}px`;
      button.classList.toggle('rdi-magnet', !!nearCorner(left, top));
    };
    const stop = () => {
      button.removeEventListener('pointermove', move);
      button.removeEventListener('pointerup', stop);
      button.removeEventListener('pointercancel', stop);
      button.classList.remove('rdi-dragging', 'rdi-magnet');
      if (!button.dragged) return;
      const left = parseInt(button.style.left, 10);
      const top = parseInt(button.style.top, 10);
      saveState(key, { corner: nearCorner(left, top), left, top });
      repositionAll();
    };
    button.addEventListener('pointermove', move);
    button.addEventListener('pointerup', stop);
    button.addEventListener('pointercancel', stop);
  });

  // O clique (ou Enter/Espaço) abre a janela, a menos que tenha sido o fim de um arraste.
  button.addEventListener('click', () => {
    if (button.dragged) {
      button.dragged = false;
      return;
    }
    const restore = button.onRestore;
    hideDockIcon(key);
    restore?.();
  });
}

/**
 * Mostra (ou atualiza) o ícone da janela `key`.
 * @param {string} key
 * @param {object} options
 * @param {string} options.label     Nome da janela, já traduzido.
 * @param {string} options.icon      Classe Font Awesome do ícone.
 * @param {Function} options.onRestore  Chamado ao clicar: reabre a janela.
 * @param {{left:number, top:number}} [options.from]  Onde estava a janela (lugar do ícone sem posição salva).
 * @param {string|number} [options.badge]  Selo no ícone (vazio esconde).
 */
export function showDockIcon(key, { label, icon: iconName, onRestore, from, badge } = {}) {
  let button = icons.get(key);
  if (!button) {
    button = document.createElement('button');
    button.type = 'button';
    button.className = 'ruptura-dock-icon';
    button.dataset.dock = key;
    const glyph = document.createElement('i');
    glyph.setAttribute('aria-hidden', 'true');
    const seal = document.createElement('span');
    seal.className = 'rdi-badge';
    button.append(glyph, seal);
    enableDrag(key, button);
    document.body.append(button);
    icons.set(key, button);
  }
  const hint = game.i18n.localize('RUPTURA.Dock.Hint');
  button.querySelector('i').className = `fa-solid ${iconName ?? 'fa-window-maximize'}`;
  button.setAttribute('aria-label', `${label}: ${hint}`);
  button.dataset.tooltip = `${label}: ${hint}`;
  button.onRestore = onRestore;
  if (from) button.from = from;
  setDockBadge(key, badge);
  repositionAll();
  return button;
}

export function hideDockIcon(key) {
  icons.get(key)?.remove();
  icons.delete(key);
  repositionAll();
}

export function isDocked(key) {
  return icons.has(key);
}

export function setDockBadge(key, value) {
  const seal = icons.get(key)?.querySelector('.rdi-badge');
  if (!seal) return;
  const text = value === undefined || value === null ? '' : String(value);
  seal.textContent = text;
  seal.hidden = !text;
}

/**
 * Minimiza (ou restaura) um painel flutuante do módulo: escondido, ele vira o ícone.
 * `dock` = { key, label (chave de tradução), icon, badge?: () => valor }.
 * `save` grava `{ collapsed }` no estado do painel.
 */
export function setMinimized(target, minimized, dock, save) {
  target.classList.toggle('collapsed', minimized);
  save?.({ collapsed: minimized });
  if (!minimized) return hideDockIcon(dock.key);
  const left = parseInt(target.style.left, 10);
  const top = parseInt(target.style.top, 10);
  showDockIcon(dock.key, {
    label: game.i18n.localize(dock.label),
    icon: dock.icon,
    badge: dock.badge?.(),
    from: Number.isFinite(left) && Number.isFinite(top) ? { left, top } : undefined,
    onRestore: () => setMinimized(target, false, dock, save)
  });
}

window.addEventListener('resize', repositionAll);
