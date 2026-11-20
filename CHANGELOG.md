# Changelog

## 0.12.1

- Quadro de Pessoal: a Vesper, Gerente dos Separados, fica lotada no Anel 01. Para o mestre, a ficha dela mostra que ela é a Umbris, a Voz de Dearani, que deixou de aparecer como uma pessoa separada.

## 0.12.0

- **Quadro de Pessoal no tema do andar:** dentro do Foundry, o quadro copia a paleta, a textura e a fonte dos títulos do andar ativo e muda junto quando o andar, a cena ou o tema mudam. Fora do Foundry, continua no visual claro.
- **Anel atual em destaque:** o anel do andar em que o grupo está (o da cena ou o do mundo) ganha contorno na cor do andar e o selo "Atual". No painel, um botão "Anel atual" leva direto a ele. Fora do Foundry, `?anel=N` no endereço marca o anel.

## 0.11.0

- **Quadro de Pessoal dos Doze Anéis:** novo botão nos controles de token, disponível para todos. Ele abre numa janela o mapa dos doze anéis da Esfera, com a equipe da Organização do Arconte em cada um, num visual corporativo. Os jogadores veem só quem já tem nome na Esfera, com função e lotação.
- O mestre vê também os agentes de cada anel, as notas do andar e as pessoas da campanha Além da Luz que ainda estão fora da Organização. Ele pode mudar o anel, o nome na Esfera, a função e quem está na Organização. As mudanças ficam salvas no mundo e atualizam as janelas abertas dos jogadores. API `ringsMap` para macros.
- **Mapa do Terrário** em `docs/terrario` (e no GitHub Pages): os NPCs da campanha Além da Luz por região, com retrato, facção e descrição. As artes ficam no módulo, em `docs/terrario/arte`.

## 0.10.0

- **Encaixe dos Sigilos:** tela com um encaixe por andar da Esfera, em anel, para as runas criadas pelo Sigil Generator. Os jogadores arrastam a runa da ficha (ou clicam no encaixe e a escolhem); o mestre grava o encaixe pelo socket, a runa sai do inventário e o chat anuncia. O mestre pode retirar a runa, que volta a quem a encaixou.
- O fundo da tela é a mente do Demiurgo: velada até o mestre usar **Revelar o fundo**, quando vira um cérebro com um tentáculo para cada encaixe. Encaixar tem uma animação sutil com o fundo velado e, com ele revelado, o tentáculo se estende até o sigilo e se prende.
- **Janelas minimizadas viram ícones:** Vigília, Inimigos, Ampulhetas e o Encaixe dos Sigilos, minimizados, viram um ícone redondo que se arrasta pela cena e se prende nos cantos, com um número (Medo, inimigos de pé, ampulhetas, sigilos).
- **Caveira do Medo redesenhada:** crânio de osso claro (tingido pela cor do andar), com órbitas, nariz, duas fileiras de dentes e mandíbula, usando óculos esportivos envolventes, com lentes espelhadas e detalhes de borracha na cor do andar. No Medo máximo, os óculos voam e a caveira gargalha batendo a mandíbula; com o Medo zerado, ela fica triste, ainda de óculos: o queixo cai e uma lágrima escorre.
- Cada andar declara a cor, o sigilo e a amarra (`floors.mjs`). API `sigils` para macros; o módulo passa a usar socket.

## 0.9.0

- **Tokens do andar 4 (A Galeria das Lembranças):** 14 tokens em `tokens/andar-4`, com moldura no tema da Galeria (aro de prata azulada e papel de parede) e tamanho do Foundry no nome do arquivo. O Orgulho e a Ira, que formam o boss, têm aro dourado-pálido e o selo de lágrima da Aflição. Arte do 2-Minute Tabletop.
- O gerador de tokens (`tokens/_fontes/make_tokens.py`) passa a receber o andar, com aro, textura e selo próprios de cada um.
- **Mapa do andar 4** em `docs/andar-4` (e no GitHub Pages): encontros, fichas das ameaças, mementos, visões do Eco da Lembrança, mapas da Czepeku e ambientes em quatro dos mistérios.
- Andar 3: o Arquivo dos Experimentos mostra o que está nas fichas da Organização.

## 0.8.0

- **Ampulhetas:** janela de contadores da aventura no estilo da Vigília. Cada contador é uma ampulheta com passos que descem um a um, reinício com giro, visibilidade por contador para os jogadores e aviso sussurrado ao mestre quando zera.
- Contagens prontas dos andares 3 a 6 (Pressão da Esfera, Jogos Mortais, Brincar com as Vítimas, O Aboleth Espreita), com o andar ativo primeiro.
- Configuração **Ampulhetas** para mostrar ou esconder a janela; API `countdowns` para macros.

## 0.7.0

- **Tokens do andar 3 (O Cofre que Mente):** 13 tokens em `tokens/andar-3`, com moldura no tema do andar e tamanho do Foundry no nome do arquivo (256 px por quadrado). Arte de 9 deles do 2-Minute Tabletop; os outros 4 são genéricos.
- O pacote do módulo passa a incluir a pasta `tokens`.

## 0.6.0

- **Andares da Esfera:** doze variantes do tema Sombria, uma por andar, cada uma com paleta, recorte dos cantos, textura e fonte dos títulos próprios.
- O mestre escolhe o andar do mundo nas configurações ou um andar por cena (aba Básico da configuração da cena).
- Cartão de abertura com o nome do andar quando ele muda; cada jogador pode desligar.
- A Vigília do mestre mostra o andar ativo.
- API: `setVariant`, `getVariants`, `getActiveVariant` e `announceVariant`, para macros.
- Motor de temas: suporte a variantes (`variants` no manifesto) e hook `ruptura.variantChanged`.

## 0.5.0

- Limiares de dano (Maior e Grave) nos painéis dos personagens e dos adversários.

## 0.4.0

- Os adversários em combate ganham uma janela própria, separada da Vigília e do Medo.

## 0.3.0

- Em combate, a Vigília do mestre também mostra a vida e a fadiga dos adversários.

## 0.2.0

- Contador de Medo "Relicário" na Vigília, integrado ao Medo do sistema Daggerheart.
- Jogadores passam a ver apenas o contador de Medo; os vitais dos personagens ficam com o mestre.

## 0.1.0

- Motor de temas: registro, tema do mundo, tema por jogador, cor de destaque e redução de efeitos.
- Painel de vitais "Vigília": vida, armadura, esperança e fadiga dos personagens em tempo real.
- Tema **Sombria — Sangue e Brasa** para a interface do Foundry e para o sistema Daggerheart.
