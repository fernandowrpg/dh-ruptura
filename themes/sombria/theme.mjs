import floors from './floors.mjs';

export default {
  id: 'sombria',
  label: 'RUPTURA.Themes.Sombria.Label',
  description: 'RUPTURA.Themes.Sombria.Description',
  accent: '#b44dff',
  styles: [
    'styles/tokens.css',
    'styles/floors.css',
    'styles/core.css',
    'styles/daggerheart.css',
    'styles/widgets.css'
  ],
  widgets: ['party-vitals'],
  variants: floors
};
