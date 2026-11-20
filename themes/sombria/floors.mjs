// Andares da Esfera dos Mistérios: as variantes do tema Sombria.
// Cada andar troca paleta, recorte, textura e fonte dos títulos (styles/floors.css).
// O mestre escolhe o andar do mundo nas configurações ou um andar por cena.
// Cada andar também guarda a cor de destaque e o sigilo que o boss libera
// (usados na tela de Encaixe dos Sigilos).

const FLOORS = [
  ['ossario', 'Ossario', 'fa-skull', '#7fe0a6'],
  ['teia', 'Teia', 'fa-spider', '#e8a33c'],
  ['cofre', 'Cofre', 'fa-vault', '#f0b429'],
  ['galeria', 'Galeria', 'fa-ghost', '#8fb8ff'],
  ['tabuleiro', 'Tabuleiro', 'fa-chess-board', '#ff6a2b'],
  ['cisterna', 'Cisterna', 'fa-water', '#2fd6c8'],
  ['corte', 'Corte', 'fa-droplet', '#d4243f'],
  ['cacada', 'Cacada', 'fa-moon', '#9cc3e6'],
  ['departamento', 'Departamento', 'fa-building', '#5fd3a6'],
  ['teatro', 'Teatro', 'fa-masks-theater', '#ffd400'],
  ['tribunal', 'Tribunal', 'fa-scale-balanced', '#e0623a'],
  ['olho', 'Olho', 'fa-eye', '#ff2e88']
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

export default FLOORS.map(([id, key, icon, color], index) => ({
  id,
  floor: index + 1,
  icon,
  color,
  sigil: `RUPTURA.Floors.${key}.Sigil`,
  bond: `RUPTURA.Floors.${key}.Bond`,
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
