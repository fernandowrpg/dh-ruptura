# Criando um tema

Um tema é uma pasta em `themes/` com um manifesto (`theme.mjs`) e arquivos CSS.
O motor carrega só o CSS do tema ativo e marca o `<html>` com
`data-ruptura-theme="<id>"`; todo o CSS do tema fica dentro desse seletor.

## Passo a passo

1. Copie `themes/_template` para `themes/<id>` (minúsculas, números e hífen).
2. Em `theme.mjs`, troque `id`, `label` e `description`.
3. Nos CSS, troque `meu-tema` pelo seu `id` no seletor `html[data-ruptura-theme="…"]`.
4. Registre o tema em `themes/index.mjs`:

   ```js
   import sombria from './sombria/theme.mjs';
   import meuTema from './meu-tema/theme.mjs';

   export default [sombria, meuTema];
   ```

5. Recarregue o Foundry. O tema aparece em **Configurações → Ruptura**.

## Manifesto (`theme.mjs`)

| Campo         | Obrigatório | O que é                                                        |
| ------------- | ----------- | -------------------------------------------------------------- |
| `id`          | sim         | Identificador único; também é o nome da pasta.                 |
| `label`       | sim         | Nome exibido. Pode ser uma chave de tradução de `lang/`.       |
| `styles`      | sim         | Arquivos CSS, na ordem de carga, relativos à pasta do tema.    |
| `description` | não         | Uma linha sobre o tema.                                        |
| `accent`      | não         | Cor de destaque padrão, para referência.                       |
| `variants`    | não         | Variantes que o mestre escolhe por mundo ou por cena. Veja "Variantes". |
| `widgets`     | não         | Widgets do módulo que o tema liga. Disponível: `party-vitals` (contador de Medo e, para o mestre, vida, armadura, esperança e fadiga dos personagens). |
| `basePath`    | não         | Pasta do tema, se ele não estiver em `modules/dh-ruptura/themes/<id>`. |

## Convenções de CSS

- **Tokens primeiro.** Declare as cores em `tokens.css` com o prefixo `--rpt-` e use
  só essas variáveis no restante. A cor escolhida pelo jogador em "Cor de destaque"
  é gravada em `--rpt-accent`.
- **Efeitos opcionais.** Com "Reduzir efeitos" ligado, o `<html>` recebe
  `data-ruptura-fx="off"`. Zere brilhos e recortes nesse seletor.
- **Sem `!important`.** O CSS dos temas é carregado fora das camadas (`@layer`) do
  Foundry, então já vence os estilos do núcleo e do sistema.
- **Um arquivo por alvo.** `core.css` para a interface do Foundry e um arquivo por
  sistema (por exemplo, `daggerheart.css`).

### Daggerheart

O sistema define a paleta em variáveis na raiz (`--golden`, `--dark-blue`, `--beige`,
`--deep-black`, `--chat-blue`, `--chat-purple` e as variações com transparência).
Redefinir essas variáveis recolore fichas, cartões de chat e a trilha de Medo sem
precisar de seletores específicos. Veja `themes/sombria/styles/daggerheart.css`.

## Variantes

Uma variante é o mesmo tema com outra paleta: a interface não muda, só os tokens.
O tema Sombria usa variantes para os andares da Esfera (`themes/sombria/floors.mjs`
e `styles/floors.css`).

1. Declare as variantes no manifesto:

   ```js
   variants: [
     { id: 'cofre', label: 'Andar 3 — O Cofre', kicker: 'Andar 3', title: 'O Cofre', subtitle: 'Folia', icon: 'fa-vault' }
   ]
   ```

   | Campo      | O que é                                                         |
   | ---------- | --------------------------------------------------------------- |
   | `id`       | Identificador (minúsculas, números e hífen; `base` é reservado). |
   | `label`    | Nome nos menus.                                                  |
   | `title`    | Nome no cartão de abertura (padrão: `label`).                    |
   | `kicker`   | Rótulo acima do nome no cartão.                                  |
   | `subtitle` | Linha abaixo do nome no cartão.                                  |
   | `icon`     | Classe Font Awesome, mostrada no cartão e na Vigília.            |

   Todos os textos podem ser chaves de tradução.

2. No CSS do tema, redefina os tokens sob o atributo da variante:

   ```css
   html[data-ruptura-theme="meu-tema"][data-ruptura-variant="cofre"] {
     --rpt-accent: #f0b429;
     --rpt-pattern: repeating-linear-gradient(45deg, #fff1 0 1px, transparent 1px 20px);
   }
   ```

   A regra tem a mesma especificidade da de "Reduzir efeitos". Repita os efeitos
   zerados em `html[data-ruptura-theme="…"][data-ruptura-variant][data-ruptura-fx="off"]`.

A variante ativa vem da flag `flags.dh-ruptura.variant` da cena em exibição; sem
flag, vale a configuração **Andar da Esfera** do mundo. O hook
`ruptura.variantChanged` é disparado com `(variante, idAnterior, { initial })` a
cada troca, e `ruptura.themeApplied` recebe a variante como segundo argumento.

## Temas em outro módulo

Outro módulo pode registrar um tema sem alterar este repositório:

```js
Hooks.on('ruptura.registerThemes', (api) => {
  api.registerTheme({
    id: 'meu-tema',
    label: 'Meu Tema',
    basePath: 'modules/meu-modulo/tema',
    styles: ['tema.css']
  });
});
```

O hook `ruptura.themeApplied` é disparado com o tema (ou `null`) a cada troca.
