import {
  MODULE_ID,
  applyTheme,
  getTheme,
  getThemes,
  getVariants,
  registerTheme,
  resolveActiveVariant,
  setVariant
} from './theme-manager.mjs';
import { registerSettings } from './settings.mjs';
import { announceVariant, registerVariantHooks } from './variants.mjs';
import { registerVitalsWidget } from './widgets/party-vitals.mjs';
import builtinThemes from '../themes/index.mjs';

registerVitalsWidget();
registerVariantHooks();

const api = {
  registerTheme,
  getThemes,
  getTheme,
  applyTheme,
  getVariants,
  setVariant,
  getActiveVariant: () => resolveActiveVariant(),
  announceVariant: (id) => announceVariant(id ? getVariants().find((variant) => variant.id === id) : resolveActiveVariant())
};

Hooks.once('init', () => {
  for (const theme of builtinThemes) registerTheme(theme);

  // Outros módulos podem registrar temas próprios neste hook.
  Hooks.callAll('ruptura.registerThemes', api);

  game.modules.get(MODULE_ID).api = api;
  registerSettings();
  applyTheme();
});

// Reaplica quando as configurações do mundo já estão garantidamente carregadas.
Hooks.once('ready', () => applyTheme());
