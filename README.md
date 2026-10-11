# Ruptura — Temas de Interface

Motor de temas visuais para o Foundry VTT (v13 e v14), com suporte ao sistema
Daggerheart. Vem com um tema e foi feito para receber outros.

## Temas

| Tema | Clima |
| ---- | ----- |
| **Sombria — Sangue e Brasa** | Gótico e infernal, em tons de roxo: cantos cortados, brilho violeta, títulos lapidares. Inspirado em Sombria, fragmento do domínio de Tenebra. |

## Instalação

No Foundry, em **Módulos → Instalar módulo**, cole o endereço do manifesto:

```
https://github.com/fernandowrpg/dh-ruptura/releases/latest/download/module.json
```

Para desenvolver, clone o repositório dentro de `Data/modules/` com o nome `dh-ruptura`.

## Configurações

- **Tema do mundo** (mestre): tema de todos os jogadores.
- **Meu tema**: escolha individual; por padrão segue o mundo.
- **Cor de destaque**: troca a cor de destaque só para você.
- **Painel de vitais**: mostra ou esconde o painel "Vigília".
- **Reduzir efeitos**: remove brilho e cantos cortados.

## Painel de vitais (Vigília)

Nos temas que o incluem (como Sombria), um painel flutuante lista os personagens
de jogadores com vida, armadura, esperança e fadiga, atualizado em tempo real.
Arraste pelo cabeçalho para reposicionar, recolha pela seta e clique em um
personagem para abrir a ficha. O mestre vê todos; cada jogador vê os personagens
que tem permissão de observar.

Os temas são escuros e forçam o esquema escuro da interface enquanto estão ativos.

## Estrutura

```
module.json
scripts/
  main.mjs            inicialização e API pública
  theme-manager.mjs   registro e aplicação de temas
  settings.mjs        configurações
themes/
  index.mjs           lista dos temas embutidos
  _template/          ponto de partida para um tema novo
  sombria/
    theme.mjs         manifesto do tema
    styles/
      tokens.css      cores, formas e fontes
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
