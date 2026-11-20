# Ruptura — Temas de Interface

Motor de temas visuais para o Foundry VTT (v13 e v14), com suporte ao sistema
Daggerheart. Vem com um tema e foi feito para receber outros.

## Temas

| Tema | Clima |
| ---- | ----- |
| **Sombria — Sangue e Brasa** | Gótico e infernal, em tons de roxo: cantos cortados, brilho violeta, títulos lapidares. Inspirado em Sombria, fragmento do domínio de Tenebra. |

## Andares da Esfera

O tema Sombria tem uma variante para cada andar da Esfera dos Mistérios. Cada andar
troca a paleta, o recorte dos cantos, a textura da barra lateral e da Vigília e a
fonte dos títulos.

| Andar | Variante | Clima |
| ----- | -------- | ----- |
| 1 | O Ossário | osso, cinza de cripta e fogo-fátuo verde |
| 2 | A Teia de Anansi | âmbar, ocre e fios de seda |
| 3 | O Cofre que Mente | ouro, bronze oxidado e grade de cofre |
| 4 | A Galeria das Lembranças | azul espectral e papel de parede desbotado |
| 5 | O Tabuleiro do Olho | negro do Vazio, olho laranja e casas de tabuleiro, cantos retos |
| 6 | A Cisterna da Vontade | verde-água bioluminescente e ondas |
| 7 | A Corte da Noite Eterna | carmesim, ouro velho e sangue escorrendo |
| 8 | A Caçada sem Lua | prata de lua, musgo e troncos |
| 9 | O Departamento | escritório estéril, verde de terminal, letra de máquina |
| 10 | O Teatro Amarelo | amarelo doentio e cortina de palco |
| 11 | O Tribunal das Fúrias | mármore negro, bronze e pena vermelha |
| 12 | O Olho por Trás de Tudo | negro absoluto, magenta e íris em anéis |

**Como o mestre escolhe o andar:**

- **Para o mundo todo:** Configurações → Ruptura → **Andar da Esfera**.
- **Por cena:** na configuração da cena, aba **Básico**, campo **Andar da Esfera
  (tema)**. Enquanto a cena estiver em exibição, ela usa esse andar; "Seguir o andar
  do mundo" volta para o andar das configurações.
- **Por macro:**

  ```js
  game.modules.get('dh-ruptura').api.setVariant('cofre'); // ou 'base' para tirar o andar
  ```

Quando o andar muda, todos veem um cartão de abertura com o nome do andar. Cada
jogador pode desligá-lo em **Anunciar troca de andar**. A Vigília do mestre mostra
o andar ativo.

## Instalação

No Foundry, em **Módulos → Instalar módulo**, cole o endereço do manifesto:

```
https://github.com/fernandowrpg/dh-ruptura/releases/latest/download/module.json
```

Para desenvolver, clone o repositório dentro de `Data/modules/` com o nome `dh-ruptura`.

## Configurações

- **Tema do mundo** (mestre): tema de todos os jogadores.
- **Andar da Esfera** (mestre): variante do tema Sombria; cada cena pode ter a sua.
- **Meu tema**: escolha individual; por padrão segue o mundo.
- **Anunciar troca de andar**: mostra ou esconde o cartão de abertura do andar.
- **Cor de destaque**: troca a cor de destaque só para você.
- **Painel de vitais**: mostra ou esconde o painel "Vigília".
- **Ampulhetas**: mostra ou esconde a janela de contadores da aventura.
- **Reduzir efeitos**: remove brilho e cantos cortados.

## Painel de vitais (Vigília)

Nos temas que o incluem (como Sombria), o mestre vê um painel flutuante com:

- o **contador de Medo**: um crânio de óculos cromados com o número na testa e
  botões para ganhar e gastar. Ele lê e grava o Medo do próprio Daggerheart, então
  anda junto com a trilha nativa do sistema;
- os **personagens de jogadores**, com vida, armadura, esperança e fadiga,
  atualizados em tempo real. Clique em um personagem para abrir a ficha.

Em combate, o mestre ganha uma segunda janela, **Inimigos**, com vida e fadiga de
cada adversário do encontro; os derrotados ficam esmaecidos. Ela tem posição e
estado de recolhimento próprios e some quando o combate termina.

Os jogadores veem apenas o contador de Medo: o crânio com um anel de marcadores em
volta. O brilho dos olhos cresce por trás das lentes conforme o Medo sobe.

O crânio também reage aos extremos, para o mestre e para os jogadores:

- **Medo no máximo:** os óculos voam, os olhos viram fendas em brasa e o crânio
  gargalha, tremendo e batendo o queixo.
- **Medo zerado:** o crânio fica triste, ainda de óculos: a cabeça pende, os óculos
  escorregam no nariz, o queixo cai e uma lágrima escorre.

**Reduzir efeitos** mantém as expressões, sem movimento.

Arraste para reposicionar. O botão **−** minimiza o painel (veja abaixo).

## Janelas minimizadas

Minimizada, cada janela do módulo (Vigília, Inimigos, Ampulhetas e Encaixe dos
Sigilos) vira um ícone redondo que flutua sobre a cena, em vez de uma barra com o nome:

- **Clique** no ícone para abrir a janela de novo; **arraste** para movê-lo.
- **Solte perto de um canto** da tela para prendê-lo ali: ele brilha durante o arraste
  para avisar. Ícones presos no mesmo canto ficam em fila e continuam no canto quando a
  janela do navegador muda de tamanho. Arraste de novo para soltá-lo.
- O ícone mostra um número: o Medo (Vigília), os inimigos de pé, as ampulhetas e os
  sigilos encaixados.

O estado minimizado e o lugar de cada ícone ficam salvos por jogador.

## Ampulhetas (contadores da aventura)

Uma janela no mesmo estilo da Vigília para as contagens da aventura. Cada contador é
uma ampulheta com um número de passos; a areia desce um passo por vez e a ampulheta
fica vermelha ao zerar.

- **Nova ampulheta:** nome, passos, o que a faz descer (cada teste, cada falha, cada
  ataque dos PJs, cada foco ou quando o mestre quiser), se reinicia ao zerar, se os
  jogadores a veem e o efeito ao zerar.
- **Contagem do andar…:** adiciona as contagens prontas da Esfera, com o andar ativo
  primeiro (Pressão da Esfera dos andares 3 a 6, Jogos Mortais, Brincar com as
  Vítimas e O Aboleth Espreita).
- **Controles:** descer um passo, devolver um passo, virar a ampulheta (reinicia com
  uma animação de giro), mostrar ou ocultar dos jogadores, editar e remover. Clicar
  num marcador define quantos passos restam.
- Ao zerar, o mestre recebe uma mensagem sussurrada com o efeito.
- Os jogadores veem só as ampulhetas marcadas como visíveis, sem os efeitos.

Por macro:

```js
const { countdowns } = game.modules.get('dh-ruptura').api;
const item = await countdowns.add({ name: 'Ritual', max: 6, trigger: 'test', visible: true });
await countdowns.step(item.id);   // desce um passo
await countdowns.reset(item.id);  // vira a ampulheta
```

## Encaixe dos Sigilos

Uma tela com um encaixe por andar da Esfera, em anel: o andar 1 no topo, o Arco I à
direita e o Arco II à esquerda. Cada encaixe tem a cor e o ícone do seu andar. Abra pelo
botão **Encaixe dos Sigilos** nos controles de token (todos os jogadores o têm) ou por
macro.

As runas são os itens criados pelo [Sigil Generator](https://github.com/fernandowrpg/sigil-generator)
(com as flags dele ou a imagem `runa-<semente>.png`).

- **Encaixar:** arraste a runa da ficha do personagem até um encaixe vazio, ou clique no
  encaixe e escolha a runa. Os jogadores só encaixam runas dos próprios personagens; o
  pedido vai ao mestre, então é preciso um mestre conectado. A runa sai do inventário,
  acende na cor do andar e o chat anuncia o encaixe.
- **Retirar (mestre):** o **×** no encaixe devolve a runa ao personagem que a encaixou
  (ou ao diretório de Itens, se ele não existir mais). Runas que o mestre encaixa direto
  do diretório continuam lá.
- **Ver a runa:** clicar num encaixe preenchido abre o diário da runa; passar o cursor
  mostra o andar, a runa e quem a encaixou. O mestre vê também o sigilo esperado e a
  amarra do Demiurgo.
- Os jogadores só veem o nome e o ícone dos andares que já alcançaram (até o andar ativo).

**O fundo é a mente.** Atrás dos encaixes há um cérebro com um tentáculo para cada
encaixe. Até o mestre revelar, ele aparece velado, como um padrão orgânico distorcido.
**Revelar o fundo** (botão do mestre) firma as dobras num cérebro que pulsa, diante de
todos os que estão com a tela aberta; **Mostrar a todos** abre a tela para todos.

O encaixe tem duas animações:

- **Fundo velado:** sutil; a runa assenta devagar e um anel de luz se abre.
- **Fundo revelado:** o tentáculo do andar se estende da mente até o encaixe, se prende,
  a runa acende e aquela parte do cérebro brilha na cor do andar. Os tentáculos dos
  encaixes vazios ficam recolhidos, tateando o ar. Ao revelar, os tentáculos dos sigilos
  já encaixados se estendem um depois do outro.

**Reduzir efeitos** desliga as animações.

Por macro:

```js
const { sigils } = game.modules.get('dh-ruptura').api;
sigils.open();              // abre a tela
sigils.showToAll();         // abre para todos (mestre)
await sigils.reveal(true);  // revela o fundo (false volta a velar)
sigils.list();              // runas encaixadas, por andar
```

## Quadro de Pessoal dos Doze Anéis

O botão **Quadro de Pessoal dos Doze Anéis**, nos controles de token, fica disponível para todos.
Ele abre numa janela o mapa de `docs/esfera`, com a equipe da Organização do Arconte em cada anel.

- Os jogadores veem só quem já tem nome na Esfera, com a função e o anel onde trabalha.
- O mestre vê também os agentes de cada anel, as notas do andar e quem ainda está fora da
  Organização. Clicando numa pessoa, ele muda o anel, o nome na Esfera, a função e se ela
  está na Organização. As mudanças ficam salvas no mundo e atualizam as janelas abertas.
- A mesma página está no GitHub Pages. Fora do Foundry, `?mestre` no endereço mostra a vista do
  mestre, só para leitura.

```js
const { ringsMap } = game.modules.get('dh-ruptura').api;
ringsMap.open();     // abre o quadro
ringsMap.changes();  // mudanças feitas pelo mestre, por personagem
```

Os temas são escuros e forçam o esquema escuro da interface enquanto estão ativos.

## Estrutura

```
module.json
scripts/
  main.mjs            inicialização e API pública
  theme-manager.mjs   registro e aplicação de temas e variantes
  settings.mjs        configurações
  variants.mjs        andar por cena e cartão de abertura
  widgets/
    ui.mjs            peças comuns das janelas (arrastar, minimizar)
    dock.mjs          ícones das janelas minimizadas
    party-vitals.mjs  Vigília, Medo e Inimigos
    countdowns.mjs    Ampulhetas
    sigils.mjs        Encaixe dos Sigilos
    mind.mjs          a mente por trás dos encaixes (SVG)
    rings-map.mjs     Quadro de Pessoal dos Doze Anéis
themes/
  index.mjs           lista dos temas embutidos
  _template/          ponto de partida para um tema novo
  sombria/
    theme.mjs         manifesto do tema
    floors.mjs        os doze andares (variantes), com cor, sigilo e contagens
    styles/
      tokens.css      cores, formas e fontes
      floors.css      tokens de cada andar
      core.css        interface do Foundry
      daggerheart.css sistema Daggerheart
lang/                 traduções
docs/CRIANDO-TEMAS.md guia para criar temas
```

## Criando um tema

Veja [docs/CRIANDO-TEMAS.md](docs/CRIANDO-TEMAS.md).

## Publicando uma versão

Crie uma tag `vX.Y.Z` e envie para o GitHub. O fluxo em
`.github/workflows/release.yml` grava a versão no `module.json`, gera o
`module.zip` e anexa os dois arquivos à release.

## Compatibilidade

- Foundry VTT 13 (verificado na 13.351) e 14.
- Daggerheart (Foundryborne) 1.9.x, verificado na 1.9.14.

## Licença

MIT. Daggerheart é propriedade da Darrington Press; Tormenta e Tenebra são
propriedade da Jambô Editora. Este módulo é um trabalho de fã, sem vínculo oficial.
