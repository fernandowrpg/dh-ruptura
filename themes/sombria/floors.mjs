// Andares da Esfera dos Mistérios: as variantes do tema Sombria.
// Cada andar troca paleta, recorte, textura e fonte dos títulos (styles/floors.css).
// O mestre escolhe o andar do mundo nas configurações ou um andar por cena.

const FLOORS = [
  ['ossario', 'Ossario', 'fa-skull'],
  ['teia', 'Teia', 'fa-spider'],
  ['cofre', 'Cofre', 'fa-vault'],
  ['galeria', 'Galeria', 'fa-ghost'],
  ['tabuleiro', 'Tabuleiro', 'fa-chess-board'],
  ['cisterna', 'Cisterna', 'fa-water'],
  ['corte', 'Corte', 'fa-droplet'],
  ['cacada', 'Cacada', 'fa-moon'],
  ['departamento', 'Departamento', 'fa-building'],
  ['teatro', 'Teatro', 'fa-masks-theater'],
  ['tribunal', 'Tribunal', 'fa-scale-balanced'],
  ['olho', 'Olho', 'fa-eye']
];

export default FLOORS.map(([id, key, icon], index) => ({
  id,
  floor: index + 1,
  icon,
  label: `RUPTURA.Floors.${key}.Label`,
  kicker: `RUPTURA.Floors.${key}.Kicker`,
  title: `RUPTURA.Floors.${key}.Title`,
  subtitle: `RUPTURA.Floors.${key}.Subtitle`
}));
