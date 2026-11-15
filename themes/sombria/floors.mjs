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

/**
 * Contagens de cada andar, prontas para virar ampulhetas na janela do mestre.
 * `trigger`: o que faz a areia descer (test, fail, attack, spotlight, custom).
 * `loop`: a contagem reinicia ao zerar (Pressão da Esfera).
 */
const COUNTDOWNS = {
  cofre: [
    { key: 'Inventario', max: 4, trigger: 'test', loop: true }
  ],
  galeria: [
    { key: 'EcoDaLembranca', max: 5, trigger: 'test', loop: true }
  ],
  tabuleiro: [
    { key: 'OlharDoVazio', max: 4, trigger: 'test', loop: true },
    { key: 'JogosMortais', max: 7, trigger: 'custom', loop: false },
    { key: 'BrincarComAsVitimas', max: 7, trigger: 'attack', loop: false }
  ],
  cisterna: [
    { key: 'Sussurro', max: 5, trigger: 'test', loop: true },
    { key: 'AbolethEspreita', max: 6, trigger: 'fail', loop: false }
  ]
};

export default FLOORS.map(([id, key, icon], index) => ({
  id,
  floor: index + 1,
  icon,
  label: `RUPTURA.Floors.${key}.Label`,
  kicker: `RUPTURA.Floors.${key}.Kicker`,
  title: `RUPTURA.Floors.${key}.Title`,
  subtitle: `RUPTURA.Floors.${key}.Subtitle`,
  countdowns: (COUNTDOWNS[id] ?? []).map(({ key: preset, ...data }) => ({
    ...data,
    name: `RUPTURA.Countdowns.Presets.${preset}.Name`,
    effect: `RUPTURA.Countdowns.Presets.${preset}.Effect`
  }))
}));
