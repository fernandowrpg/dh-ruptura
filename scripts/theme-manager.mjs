export const MODULE_ID = 'dh-ruptura';

/** Valores especiais das configurações de tema. */
export const THEME_NONE = 'none';
export const THEME_WORLD = 'world';

const themes = new Map();

/**
 * @typedef {object} RupturaTheme
 * @property {string} id            Identificador único (minúsculas, números e hífen).
 * @property {string} label         Nome exibido; pode ser uma chave de tradução.
 * @property {string[]} styles      Arquivos CSS, relativos a `basePath`.
 * @property {string} [basePath]    Pasta do tema. Padrão: `modules/dh-ruptura/themes/<id>`.
 * @property {string} [description] Descrição curta; pode ser uma chave de tradução.
 * @property {string} [accent]      Cor de destaque padrão (hex), usada como referência.
 */

/**
 * Registra um tema. Deve ser chamado até o fim do hook `init`.
 * @param {RupturaTheme} theme
 */
export function registerTheme(theme) {
  if (!theme?.id || !/^[a-z0-9][a-z0-9-]*$/.test(theme.id)) {
    throw new Error(`${MODULE_ID} | id de tema inválido: ${theme?.id}`);
  }
  if ([THEME_NONE, THEME_WORLD].includes(theme.id)) {
    throw new Error(`${MODULE_ID} | "${theme.id}" é um id reservado`);
  }
  if (!Array.isArray(theme.styles) || !theme.styles.length) {
    throw new Error(`${MODULE_ID} | o tema "${theme.id}" não declara nenhum CSS em "styles"`);
  }
  if (themes.has(theme.id)) console.warn(`${MODULE_ID} | tema "${theme.id}" registrado novamente; substituindo`);

  themes.set(theme.id, {
    basePath: `modules/${MODULE_ID}/themes/${theme.id}`,
    ...theme
  });
}

export function getThemes() {
  return Array.from(themes.values());
}

export function getTheme(id) {
  return themes.get(id) ?? null;
}

function readSetting(key, fallback) {
  try {
    return game.settings.get(MODULE_ID, key);
  } catch {
    return fallback;
  }
}

/** Tema ativo para este cliente, considerando o padrão do mundo. */
export function resolveActiveTheme() {
  let id = readSetting('theme', THEME_WORLD);
  if (id === THEME_WORLD) id = readSetting('defaultTheme', THEME_NONE);
  return getTheme(id);
}

function accentCss() {
  const value = readSetting('accent', null);
  if (!value) return '';
  return typeof value === 'string' ? value : (value.css ?? '');
}

/** Aplica o tema ativo: carrega o CSS dele e marca o `<html>` com os atributos de escopo. */
export function applyTheme() {
  const root = document.documentElement;
  const theme = resolveActiveTheme();
  const current = root.dataset.rupturaTheme ?? null;

  if (current !== (theme?.id ?? null)) {
    document.querySelectorAll('link[data-ruptura-style]').forEach((link) => link.remove());

    if (theme) {
      for (const file of theme.styles) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = foundry.utils.getRoute(`${theme.basePath}/${file}`);
        link.dataset.rupturaStyle = theme.id;
        document.head.appendChild(link);
      }
      root.dataset.rupturaTheme = theme.id;
    } else {
      delete root.dataset.rupturaTheme;
    }
  }

  if (!theme) {
    delete root.dataset.rupturaFx;
    root.style.removeProperty('--rpt-accent');
    Hooks.callAll('ruptura.themeApplied', null);
    return;
  }

  root.dataset.rupturaFx = readSetting('reduceEffects', false) ? 'off' : 'on';

  const accent = accentCss();
  if (accent) root.style.setProperty('--rpt-accent', accent);
  else root.style.removeProperty('--rpt-accent');

  Hooks.callAll('ruptura.themeApplied', theme);
}
