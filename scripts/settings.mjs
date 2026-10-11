import { MODULE_ID, THEME_NONE, THEME_WORLD, applyTheme, getThemes } from './theme-manager.mjs';
import { syncVitalsWidget } from './widgets/party-vitals.mjs';

export function registerSettings() {
  const themeChoices = Object.fromEntries(getThemes().map((theme) => [theme.id, theme.label]));
  const firstTheme = getThemes()[0]?.id ?? THEME_NONE;

  game.settings.register(MODULE_ID, 'defaultTheme', {
    name: 'RUPTURA.Settings.DefaultTheme.Name',
    hint: 'RUPTURA.Settings.DefaultTheme.Hint',
    scope: 'world',
    config: true,
    type: String,
    choices: { ...themeChoices, [THEME_NONE]: 'RUPTURA.Settings.Choice.None' },
    default: firstTheme,
    onChange: () => applyTheme()
  });

  game.settings.register(MODULE_ID, 'theme', {
    name: 'RUPTURA.Settings.Theme.Name',
    hint: 'RUPTURA.Settings.Theme.Hint',
    scope: 'client',
    config: true,
    type: String,
    choices: {
      [THEME_WORLD]: 'RUPTURA.Settings.Choice.World',
      ...themeChoices,
      [THEME_NONE]: 'RUPTURA.Settings.Choice.None'
    },
    default: THEME_WORLD,
    onChange: () => applyTheme()
  });

  game.settings.register(MODULE_ID, 'accent', {
    name: 'RUPTURA.Settings.Accent.Name',
    hint: 'RUPTURA.Settings.Accent.Hint',
    scope: 'client',
    config: true,
    type: new foundry.data.fields.ColorField({ nullable: true, blank: true, initial: null }),
    default: null,
    onChange: () => applyTheme()
  });

  game.settings.register(MODULE_ID, 'showVitals', {
    name: 'RUPTURA.Settings.ShowVitals.Name',
    hint: 'RUPTURA.Settings.ShowVitals.Hint',
    scope: 'client',
    config: true,
    type: Boolean,
    default: true,
    onChange: () => syncVitalsWidget()
  });

  // Posição e estado (recolhido) do painel de vitais; gravado ao arrastar.
  game.settings.register(MODULE_ID, 'vitalsState', {
    scope: 'client',
    config: false,
    type: Object,
    default: {}
  });

  game.settings.register(MODULE_ID, 'reduceEffects', {
    name: 'RUPTURA.Settings.ReduceEffects.Name',
    hint: 'RUPTURA.Settings.ReduceEffects.Hint',
    scope: 'client',
    config: true,
    type: Boolean,
    default: false,
    onChange: () => applyTheme()
  });
}
