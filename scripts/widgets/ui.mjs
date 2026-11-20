// Peças comuns das janelas flutuantes do módulo (Vigília, Inimigos, Ampulhetas).
import { MODULE_ID } from '../theme-manager.mjs';
import { setMinimized } from './dock.mjs';

export function setting(key, fallback) {
  try {
    return game.settings.get(MODULE_ID, key);
  } catch {
    return fallback;
  }
}

export function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function icon(name) {
  const node = el('i', `fa-solid ${name}`);
  node.setAttribute('aria-hidden', 'true');
  return node;
}

/** Botão só com ícone, com rótulo acessível e dica. */
export function iconButton(className, iconName, label, onClick) {
  const button = el('button', className);
  button.type = 'button';
  button.title = label;
  button.setAttribute('aria-label', label);
  button.append(icon(iconName));
  button.addEventListener('click', onClick);
  return button;
}

export function place(target, left, top) {
  const maxLeft = Math.max(0, window.innerWidth - target.offsetWidth);
  const maxTop = Math.max(0, window.innerHeight - 40);
  target.style.left = `${Math.min(Math.max(0, left), maxLeft)}px`;
  target.style.top = `${Math.min(Math.max(0, top), maxTop)}px`;
}

/** Arrasta `target` pelo `handle` e grava a posição final com `save`. */
export function enableDrag(target, handle, save) {
  handle.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || event.target.closest('button, select, input')) return;
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

/**
 * Cabeçalho de painel: título, botão de minimizar e alça de arrasto.
 * Minimizado, o painel vira um ícone flutuante (ver dock.mjs); `dock` diz qual.
 */
export function buildHeader(target, titleKey, save, dock) {
  const header = el('header', 'rv-header');
  header.append(el('h3', 'rv-title', game.i18n.localize(titleKey)));
  const label = game.i18n.localize('RUPTURA.Dock.Minimize');
  const toggle = el('button', 'rv-toggle');
  toggle.type = 'button';
  toggle.setAttribute('aria-label', label);
  toggle.title = label;
  toggle.append(icon('fa-minus'));
  toggle.addEventListener('click', () => setMinimized(target, true, dock, save));
  header.append(toggle);
  enableDrag(target, header, save);
  return header;
}
