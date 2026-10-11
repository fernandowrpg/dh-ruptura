import { MODULE_ID, applyTheme, getTheme, getThemes, registerTheme } from './theme-manager.mjs';
import { registerSettings } from './settings.mjs';
import { registerVitalsWidget } from './widgets/party-vitals.mjs';
import builtinThemes from '../themes/index.mjs';

registerVitalsWidget();

const api = { registerTheme, getThemes, getTheme, applyTheme };

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
