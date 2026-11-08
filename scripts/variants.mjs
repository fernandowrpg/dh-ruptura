import { MODULE_ID, VARIANT_FLAG, VARIANT_WORLD, applyTheme, getVariants } from './theme-manager.mjs';
import { variantChoices } from './settings.mjs';

const FIELD = `flags.${MODULE_ID}.${VARIANT_FLAG}`;
const CARD_ID = 'ruptura-variant-card';
const CARD_DURATION = 5200;

let cardTimer = null;

function setting(key, fallback) {
  try {
    return game.settings.get(MODULE_ID, key);
  } catch {
    return fallback;
  }
}

function localize(text) {
  return text ? game.i18n.localize(text) : '';
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

/* ---------- Campo na configuração de cena ---------- */

/** Acrescenta à aba "Básico" da cena a escolha da variante usada enquanto ela estiver em exibição. */
function injectSceneField(app, element) {
  if (!game.user.isGM || !getVariants().length) return;
  const root = element instanceof HTMLElement ? element : element?.[0];
  if (!root || root.querySelector(`[name="${FIELD}"]`)) return;

  const part = root.querySelector('[data-application-part="basics"]') ?? root.querySelector('.tab[data-tab="basics"]');
  if (!part) return;

  const current = app.document?.getFlag(MODULE_ID, VARIANT_FLAG) ?? VARIANT_WORLD;
  const inputId = `${app.id}-ruptura-variant`;

  const select = el('select');
  select.name = FIELD;
  select.id = inputId;
  const choices = { [VARIANT_WORLD]: 'RUPTURA.Settings.Choice.VariantWorld', ...variantChoices() };
  for (const [value, label] of Object.entries(choices)) {
    const option = el('option', null, localize(label));
    option.value = value;
    option.selected = value === current;
    select.append(option);
  }

  const label = el('label', null, localize('RUPTURA.Settings.SceneVariant.Name'));
  label.htmlFor = inputId;
  const fields = el('div', 'form-fields');
  fields.append(select);

  const group = el('div', 'form-group ruptura-scene-variant');
  group.append(label, fields, el('p', 'hint', localize('RUPTURA.Settings.SceneVariant.Hint')));
  part.append(group);
}

/* ---------- Cartão de abertura ---------- */

function removeCard() {
  clearTimeout(cardTimer);
  cardTimer = null;
  document.getElementById(CARD_ID)?.remove();
}

/**
 * Mostra o cartão de abertura da variante: ícone, rótulo, nome e subtítulo.
 * @param {import('./theme-manager.mjs').RupturaVariant} variant
 */
export function announceVariant(variant) {
  if (!variant) return;
  removeCard();

  const card = el('div', 'ruptura-variant-card');
  card.id = CARD_ID;
  card.dataset.variant = variant.id;
  card.setAttribute('role', 'status');
  card.setAttribute('aria-live', 'polite');

  if (variant.icon) {
    const glyph = el('i', `rvc-icon fa-solid ${variant.icon}`);
    glyph.setAttribute('aria-hidden', 'true');
    card.append(glyph);
  }
  const kicker = localize(variant.kicker);
  if (kicker) card.append(el('span', 'rvc-kicker', kicker));
  card.append(el('span', 'rvc-title', localize(variant.title ?? variant.label)));
  const subtitle = localize(variant.subtitle);
  if (subtitle) card.append(el('span', 'rvc-subtitle', subtitle));

  card.addEventListener('click', removeCard);
  document.body.append(card);
  cardTimer = setTimeout(removeCard, CARD_DURATION);
}

/* ---------- Registro ---------- */

export function registerVariantHooks() {
  Hooks.on('renderSceneConfig', injectSceneField);

  // Trocar de cena pode trocar a variante.
  Hooks.on('canvasReady', () => applyTheme());

  // A flag da cena em exibição mudou.
  Hooks.on('updateScene', (scene, changes) => {
    const viewed = globalThis.canvas?.scene ?? game.scenes?.viewed;
    if (scene.id !== viewed?.id) return;
    if (foundry.utils.hasProperty(changes, `flags.${MODULE_ID}`)) applyTheme();
  });

  // Só anuncia trocas feitas com o mundo já carregado, não a variante de quem acabou de entrar.
  let settled = false;
  Hooks.once('ready', () => setTimeout(() => (settled = true), 0));

  Hooks.on('ruptura.variantChanged', (variant, _previous, { initial } = {}) => {
    if (initial || !settled || !variant) return removeCard();
    if (setting('announceVariant', true)) announceVariant(variant);
  });
}
