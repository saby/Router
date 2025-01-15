import { detection, constants } from 'Env/Env';
import { IFullData, IBuilderOptions } from './Interface';
import { controller } from 'I18n/i18n';
import { storageKey } from './DataAggregators/LoadingStatus';
import { getResourceUrl } from 'UI/Utils';

const newLine = '\n';
const removeNewLinePattern = /(\r\n|\n|\r|)/gm;
const removeDoubleWhiteSpaces = /\s+/;
interface IRenderFullData extends IFullData {
    moduleName?: string;
}

export function render(values: IRenderFullData): string {
    return [
        '<!DOCTYPE html>',
        `<html lang=${controller.currentLang || 'ru'}>`,
        '  <head>',
        `    ${values.HeadAPIData}`,
        '  </head>',
        `  <body ${_private.getBodyAttrs(values)}>`,
        `    <div id="wasaby-content" style="width: inherit; height: inherit;" application="${values.moduleName}">`,
        `      ${values.controlsHTML}`,
        '    </div>',
        _private.getBaseScripts(values),
        _private.getTimeTesterScripts(values),
        _private.getDepsScripts(values),
        '    <div id="wasabyStartScript">',
        `      ${_private.prepareScript(getStartScript(values))}`,
        '    </div>',
        _private.getMaintenanceContainer(),
        _private.getCheckSoftware(),
        '  </body>',
        '</html>',
    ].join(newLine);
}

/**
 * Стартовый скрипт, который в браузере "оживляет" страницу
 * @param values
 * @returns
 */
function getStartScript(values: IRenderFullData): string {
    if (values.isCanceledRevive || values.prerender) {
        return _private.getEmptyStartScript();
    }

    if (values.builderOptions?.builder) {
        return _private.getStaticPageStartScript(values.builderOptions);
    }

    const consoleMessage =
        'console.log(\n' +
        "'%c\\tЭта функция браузера предназначена для разработчиков.\\t\\n' +\n" +
        "'\\tЕсли кто-то сказал вам скопировать и вставить что-то здесь, это мошенники.\\t\\n' +\n" +
        "'\\tВыполнив эти действия, вы предоставите им доступ к своему аккаунту.\\t\\n',\n" +
        "'background: red; color: white; font-size: 22px; font-weight: var(--font-weight-bold)er; text-shadow: 1px 1px 2px black;'\n" +
        ');';

    /**
     * Для IE сначала грузим пакет с полифиллами, чтобы в ядре под IE это все было доступно
     * Поэтому, для IE объявим стартовую функцию, отличную от require
     */
    const mainStart = detection.isIE
        ? [
              'function requireIE(deps, callBack){ require(["SbisUI/polyfill"], function(){ require(deps, callBack); }); };',
              'requireIE',
          ].join('')
        : 'require';

    const requiredModules = _private.getRequiredModulesString(values.requiredModules);
    return [
        `<script key="init_script">
document.addEventListener('DOMContentLoaded', function () {
  ${mainStart}(['Env/Env', 'Application/Initializer', 'Application/Env', 'SbisUI/Wasaby', 'UI/Base', 'UI/State', 'Application/State', 'Router/router', 'SbisUI/polyfill'],
    function(Env, AppInit, AppEnv, EnvUIWasaby, UIBase, UIState, AppState, router){
        Object.assign(Env.constants, window.wsConfig);
        require(['WasabyLoader/ModulesLoader',${requiredModules}], function(ModulesLoader){
          if (performance && performance.mark) {
            performance.mark('SCRIPTS COMPILING END');
            performance.mark('CORE INIT START');
          }
          var sr = new AppState.StateReceiver(UIState.Serializer);
          AppInit.default(window.wsConfig, void 0, sr);
          ${_private.getOnChangeStateHandler()}
          var Router = router.getRootRouter(false, onChangeState);
          UIBase.BootstrapStart({ Router: Router }, document.getElementById('wasaby-content'));
          ModulesLoader.initWarmup();
          try {
            window.sessionStorage.removeItem('${storageKey}');
          } catch(err) { /* sessionStorage недоступен */}
          if (performance && performance.mark) {
            performance.mark('CORE INIT END');
          }
        });
        ${constants.isProduction ? consoleMessage : ''}
    })
});
         </script>`,
    ].join('');
}

/** ***************************************************************************************************************** */

const _private = {
    getRequiredModulesString(requiredModules: string[] | undefined): string {
        if (!requiredModules || !requiredModules.length) {
            return '';
        }
        return `'${requiredModules.join("','")}'`;
    },

    /*
     * Для определенных сценариев тестирования нужно отключать оживление страницы и убирать класс pre-load:
     * https://online.sbis.ru/opendoc.html?guid=9a741529-db8c-4698-a962-9ab5924e113c
     * Отключать оживление можно через query параметр ?isCanceledRevive=true (вместо true можно подставить любое значение)
     * *
     * Существуют также ситуации, когда и на бою нам не нужен стартовый скрипт. Например, быстрый запрос за данными
     * Актуально для Google Chrome, например
     * https://online.sbis.ru/opendoc.html?guid=9a500336-5855-4d08-9c69-b27a54ff2e37
     */
    getEmptyStartScript(): string {
        return `<script key="init_script">
         var elementPreloadClass = document.querySelector('.pre-load');
         elementPreloadClass !== null && elementPreloadClass.classList.remove('pre-load');
         </script>`;
    },

    /**
     * Стартовые скрипты для статичных страниц, которые создает builder из файлов name.html.tmpl
     * @param builderOptions
     * @returns Возвращает стартовые скрипты
     */
    getStaticPageStartScript(builderOptions: IBuilderOptions): string {
        if (builderOptions.builderCompatible) {
            throw new Error(
                'Обнаружено некорректное использование шаблона статичной страницы. ' +
                    'Нельзя строить статичную страницу в режиме совместимости ("compatible" = true)!'
            );
        }

        const dependencies =
            typeof builderOptions.dependencies === 'string'
                ? builderOptions.dependencies
                : builderOptions.dependencies
                      .map((v) => {
                          return `'${v}'`;
                      })
                      .toString();

        return `<script>
window.receivedStates = '{"ThemesController": {"themes" : {"' + (window.defaultStaticTheme || 'default') + '": true}}}';
document.addEventListener('DOMContentLoaded', function () {
   /* Шаблоны старой кодогенерации зависят от UI/Executor, новой - от Compiler/IR */
   require(['UICore/Base', 'Application/Initializer', 'Application/Env', 'SbisUI/Compatible',
            'Application/State', 'UI/State', 'Router/router', 'SbisUI/Wasaby', 'UI/Executor', 'Compiler/IR'],
      function(UICore, AppInitializer, AppEnv, Compatible, AppState, UIState, router){
         /*Первый шаг - старт Application, иницализация core и темы. Второй шаг - загрузка ресурсов*/
         AppInitializer.default(window.wsConfig, new AppEnv.EnvBrowser(window['wsConfig']),
                                new AppState.StateReceiver(UIState.Serializer));
         Compatible.AppInit();

         require(['WasabyLoader/ModulesLoader',${dependencies}], function(ModulesLoader){ModulesLoader.initWarmup();
            var templateFn = ${builderOptions.builder};
            templateFn.stable = true;
            var cnt = UICore.Control.extend({
               _template: templateFn
            });
            cnt.defaultProps = {
               notLoadThemes: true
            };
            Compatible.AppStart._shouldStart = false;
            var domElement = UICore.selectRenderDomNode(document.getElementById('wasaby-content'));
            ${_private.getOnChangeStateHandler()}
            var Router = router.getRootRouter(false, onChangeState);
            Compatible.AppStart.createControl(cnt, { Router: Router }, domElement);
            ModulesLoader.initWarmup();
            try {
               window.sessionStorage.removeItem('${storageKey}');
            } catch(err) { /* sessionStorage недоступен */}
         });
      }
   );
});
      </script>`;
    },

    getBodyAttrs(values: IRenderFullData): string {
        const bodyAttrs: string[] = [];
        if (values.BodyAPIClasses) {
            bodyAttrs.push(`class="${values.BodyAPIClasses}"`);
        }

        if (values.directionality) {
            bodyAttrs.push(`dir="${values.directionality}"`);
        }
        return bodyAttrs.join(' ');
    },

    getBaseScripts(values: IRenderFullData): string {
        if (!values.JSLinksAPIBaseData) {
            return '';
        }

        return [
            '    <div class="wasabyBaseDeps">',
            `      ${values.JSLinksAPIBaseData}`,
            '    </div>',
        ].join(newLine);
    },

    getTimeTesterScripts(values: IRenderFullData): string {
        if (!values.JSLinksAPITimeTesterData) {
            return '';
        }

        return [
            '    <div class="wasabyTimeTester">',
            `      ${values.JSLinksAPITimeTesterData}`,
            '    </div>',
        ].join(newLine);
    },

    getDepsScripts(values: IRenderFullData): string {
        if (!values.JSLinksAPIData) {
            return '';
        }

        return [
            '    <div class="wasabyJSDeps">',
            `      ${values.JSLinksAPIData}`,
            `      ${_private.addRenderTime(values)}`,
            '    </div>',
        ].join(newLine);
    },

    prepareScript(str: string): string {
        return str.replace(removeNewLinePattern, '').replace(removeDoubleWhiteSpaces, ' ');
    },

    /**
     * Добавление вычисленного времени рендера верстки на сервере
     */
    addRenderTime(values: IRenderFullData): string {
        if (!values.renderStartTime) {
            return '';
        }
        const ssrTime = Date.now() - values.renderStartTime;
        return `<script type="text/javascript">
         window['ssrTime'] = ${ssrTime};
         </script>`;
    },

    getOnChangeStateHandler() {
        const METHOD_OBJECT_NAME = 'PSWaSabyRouting';

        // calcMethodName - Вычисление "названия" метода построившего текущую страницу по правилам СП.
        // onChangeState - обработчик, который будет вызываться каждый раз, когда меняется url в адресной строке.
        return `var calcMethodName = function(url) {
            if (url === '/') {
                return '${METHOD_OBJECT_NAME}.index_html';
            }
            var params = Router.maskResolver.calculateUrlParams('/:component/:pageId', url);
            if (params.component === 'page') {
                /* pagex */
                return '${METHOD_OBJECT_NAME}.' + params.pageId;
            }
            var hyphen = params.component ? '-' : '';
            return '${METHOD_OBJECT_NAME}.' + params.component + hyphen + 'Index';
        };

        var onChangeState = function(newState) {
            if (newState.spaHistory) { window.spaHistory = newState.spaHistory; }
            if (newState.href && Router) { window['X-CURRENTMETHOD'] = calcMethodName(newState.href); };
        };`;
    },

    getCheckSoftware(): string {
        return `<script async src="${getResourceUrl(
            '/cdn/Maintenance/1.0.41/js/checkSoftware.min.js'
        )}"></script>`;
    },

    getMaintenanceContainer(): string {
        return '<div id="sbisEnvUI_errorContainer"></div>';
    },
};
