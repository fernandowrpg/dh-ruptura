export const MODULE_ID = 'dh-ruptura';

/** Valores especiais das configurações de tema. */
export const THEME_NONE = 'none';
export const THEME_WORLD = 'world';

/** Valores especiais da variante: vazio segue o mundo (na cena); `base` força o tema sem variante. */
export const VARIANT_WORLD = '';
export const VARIANT_BASE = 'base';

/** Flag de cena que escolhe a variante enquanto a cena está em exibição. */
export const VARIANT_FLAG = 'variant';

const ID_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

const themes = new Map();

/**
 * Variante de um tema: mesma interface, outra paleta. O CSS dela fica nos próprios
 * arquivos do tema, sob `html[data-ruptura-variant="<id>"]`.
 * @typedef {object} RupturaVariant
 * @property {string} id            Identificador único dentro do tema.
 * @property {string} label         Nome nos menus; pode ser uma chave de tradução.
 * @property {string} [title]       Nome no cartão de abertura (padrão: `label`); pode ser uma chave de tradução.
 * @property {string} [subtitle]    Linha curta exibida abaixo do nome; pode ser uma chave de tradução.
 * @property {string} [kicker]      Rótulo acima do nome (por exemplo, "Andar 3"); pode ser uma chave de tradução.
 * @property {string} [icon]        Classe Font Awesome (por exemplo, `fa-skull`).
 */

/**
 * @typedef {object} RupturaTheme
 * @property {string} id            Identificador único (minúsculas, números e hífen).
 * @property {string} label         Nome exibido; pode ser uma chave de tradução.
 * @property {string[]} styles      Arquivos CSS, relativos a `basePath`.
 * @property {string} [basePath]    Pasta do tema. Padrão: `modules/dh-ruptura/themes/<id>`.
 * @property {string} [description] Descrição curta; pode ser uma chave de tradução.
 * @property {string} [accent]      Cor de destaque padrão (hex), usada como referência.
 * @property {RupturaVariant[]} [variants] Variantes que o mestre pode escolher.
 */

/**
 * Registra um tema. Deve ser chamado até o fim do hook `init`.
 * @param {RupturaTheme} theme
 */
export function registerTheme(theme) {
  if (!theme?.id || !ID_PATTERN.test(theme.id)) {
    throw new Error(`${MODULE_ID} | id de tema inválido: ${theme?.id}`);
  }
  for (const variant of theme.variants ?? []) {
    if (!variant?.id || !ID_PATTERN.test(variant.id) || variant.id === VARIANT_BASE) {
      throw new Error(`${MODULE_ID} | id de variante inválido no tema "${theme.id}": ${variant?.id}`);
    }
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

/** Todas as variantes registradas, com o tema a que pertencem. */
export function getVariants() {
  return getThemes().flatMap((theme) => (theme.variants ?? []).map((variant) => ({ ...variant, theme: theme.id })));
}

/** Cena em exibição para este cliente, mesmo antes de o canvas terminar de carregar. */
function viewedScene() {
  return globalThis.canvas?.scene ?? game.scenes?.viewed ?? null;
}

/**
 * Variante ativa do tema: a flag da cena em exibição vence; sem flag, vale a do mundo.
 * @param {RupturaTheme|null} theme
 * @returns {RupturaVariant|null}
 */
export function resolveActiveVariant(theme = resolveActiveTheme()) {
  if (!theme?.variants?.length) return null;
  let id = viewedScene()?.getFlag?.(MODULE_ID, VARIANT_FLAG) || VARIANT_WORLD;
  if (id === VARIANT_WORLD) id = readSetting('variant', VARIANT_BASE);
  return theme.variants.find((variant) => variant.id === id) ?? null;
}

/**
 * Muda a variante do mundo (só o mestre). Cenas com variante própria continuam com ela.
 * @param {string} id  Id da variante, ou `base` para o tema sem variante.
 */
export async function setVariant(id) {
  if (!game.user?.isGM) throw new Error(`${MODULE_ID} | só o mestre pode trocar a variante`);
  const valid = id === VARIANT_BASE || getVariants().some((variant) => variant.id === id);
  if (!valid) throw new Error(`${MODULE_ID} | variante desconhecida: ${id}`);
  return game.settings.set(MODULE_ID, 'variant', id);
}

function accentCss() {
  const value = readSetting('accent', null);
  if (!value) return '';
  return typeof value === 'string' ? value : (value.css ?? '');
}

/** Marca o `<html>` com a variante e avisa quando ela muda depois do carregamento. */
function applyVariant(root, theme) {
  const variant = resolveActiveVariant(theme);
  const previous = root.dataset.rupturaVariant ?? null;
  const next = variant?.id ?? null;

  if (next) root.dataset.rupturaVariant = next;
  else delete root.dataset.rupturaVariant;

  if (previous !== next) Hooks.callAll('ruptura.variantChanged', variant, previous, { initial: !game.ready });
  return variant;
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
    applyVariant(root, null);
    root.style.removeProperty('--rpt-accent');
    Hooks.callAll('ruptura.themeApplied', null, null);
    return;
  }

  root.dataset.rupturaFx = readSetting('reduceEffects', false) ? 'off' : 'on';
  const variant = applyVariant(root, theme);

  const accent = accentCss();
  if (accent) root.style.setProperty('--rpt-accent', accent);
  else root.style.removeProperty('--rpt-accent');

  Hooks.callAll('ruptura.themeApplied', theme, variant);
}
