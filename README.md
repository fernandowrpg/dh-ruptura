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

Arraste para reposicionar; o mestre também pode recolher cada painel pela seta.

Os temas são escuros e forçam o esquema escuro da interface enquanto estão ativos.

## Estrutura

```
module.json
scripts/
  main.mjs            inicialização e API pública
  theme-manager.mjs   registro e aplicação de temas e variantes
  settings.mjs        configurações
  variants.mjs        andar por cena e cartão de abertura
themes/
  index.mjs           lista dos temas embutidos
  _template/          ponto de partida para um tema novo
  sombria/
    theme.mjs         manifesto do tema
    floors.mjs        os doze andares (variantes)
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
