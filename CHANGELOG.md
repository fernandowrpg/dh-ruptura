# Changelog

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
