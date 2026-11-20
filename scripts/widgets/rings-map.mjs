/**
 * Quadro de pessoal dos Doze Anéis dentro do Foundry: uma janela com a página docs/esfera do módulo.
 * Todos veem o botão. Os jogadores veem só a equipe com nome na Esfera; o mestre vê o resto
 * e pode mudar anel, nome e função, que ficam salvos no mundo (configuração `ringsMap`).
 */
import { MODULE_ID } from '../theme-manager.mjs';

const SETTING = 'ringsMap';
const { ApplicationV2 } = foundry.applications.api;

class RingsMap extends ApplicationV2 {
  static DEFAULT_OPTIONS = {
    id: 'ruptura-rings-map',
    classes: ['ruptura-rings-map'],
    window: { title: 'RUPTURA.RingsMap.Title', icon: 'fa-solid fa-bullseye', resizable: true },
    position: { width: 1100, height: 760 }
  };

  async _renderHTML() {
    const frame = document.createElement('iframe');
    frame.src = `modules/${MODULE_ID}/docs/esfera/index.html?foundry`;
    frame.title = game.i18n.localize('RUPTURA.RingsMap.Title');
    frame.style.cssText = 'width:100%;height:100%;border:0;display:block;background:var(--rpt-void, #e9ecea)';
    return frame;
  }

  _replaceHTML(result, content) {
    // Não recarrega a página a cada render, para não perder o anel escolhido.
    if (!content.querySelector('iframe')) content.replaceChildren(result);
    content.style.padding = '0';
  }

  #page() {
    return this.element?.querySelector('iframe')?.contentWindow;
  }

  refresh() {
    this.#page()?.recarregar?.();
  }

  /** Recopia as cores do andar ativo e o anel atual. O CSS de um tema novo pode chegar depois, então repete. */
  retheme() {
    const run = () => this.#page()?.tema?.();
    requestAnimationFrame(run);
    setTimeout(run, 600);
  }
}

let app = null;

export function openRingsMap() {
  app ??= new RingsMap();
  app.render({ force: true });
  app.bringToFront?.();
  return app;
}

export function registerRingsMap() {
  Hooks.once('init', () => {
    game.settings.register(MODULE_ID, SETTING, {
      scope: 'world',
      config: false,
      type: Object,
      default: {}
    });
  });

  Hooks.on('getSceneControlButtons', (controls) => {
    const tokens = controls.tokens ?? controls.token;
    if (!tokens?.tools) return;
    tokens.tools.rupturaRingsMap = {
      name: 'rupturaRingsMap',
      title: 'RUPTURA.RingsMap.Open',
      icon: 'fa-solid fa-bullseye',
      order: Object.keys(tokens.tools).length,
      button: true,
      visible: true,
      onChange: () => openRingsMap()
    };
  });

  // Quando o mestre salva uma mudança, as janelas abertas dos outros se atualizam.
  const onSetting = (document) => {
    if (document?.key === `${MODULE_ID}.${SETTING}` && app?.rendered) app.refresh();
  };
  Hooks.on('createSetting', onSetting);
  Hooks.on('updateSetting', onSetting);

  // O quadro acompanha o tema: troca de andar, de cena ou de tema.
  Hooks.on('ruptura.themeApplied', () => {
    if (app?.rendered) app.retheme();
  });
}

/** API para macros: `game.modules.get('dh-ruptura').api.ringsMap`. */
export const ringsMapApi = {
  open: openRingsMap,
  /** As mudanças feitas pelo mestre no Foundry, por id de personagem. */
  changes: () => game.settings.get(MODULE_ID, SETTING)
};
