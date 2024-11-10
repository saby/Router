import { Head as AppHead, IPageTagAttrs } from 'Application/Page';
import { IDataAggregatorModule, IFullData } from 'Router/_Builder/_Bootstrap/Interface';
import { cookie } from 'Env/Env';

export const storageKey = 'theForceReloadWasEarly';

/**
 * Бездумное обновление страницы в случае ошибки приводит к шквалу запросов на сервер.
 * Например, наступает момент нагрузки. Падает cdn. На страницу не прилетают супербандлы и все
 * Лавина пикообразно возрастает в несколько раз.
 * Поэтому было принято решение помечать страницу как принудительно перезагруженная и не обновлять ее в дальнейшем.
 * Потом 1 раз за одну загрузку страницы покажем нативный диалог с сообщением о проблемах
 * и предложением перезагрузить страницу.
 *
 * А как же снять флаг? Флаг снимается в стартовом скрипте.
 */
const onErrorHandler = `
    function onErrorHandler(name) {
        window.wsConfig.loadingStatus = window.wsConfig.loadingStatus || {};
        window.wsConfig.loadingStatus[name] = 'ERROR';
        try {
            if (window.sessionStorage.getItem('${storageKey}')) {
                window.wsConfig.loadingStatus.${storageKey} = true;
                if (!window.wsConfig.loadingStatus.dialogShown) {
                    var res = window.confirm('При загрузке страницы не все ресурсы были загружены.'
                        +' Страница может работать некорректно. Перезагрузить страницу?');
                    if (res) {
                        window.location.reload();
                    }
                    window.wsConfig.loadingStatus.dialogShown = true;
                }
                return;
            }
            window.sessionStorage.setItem('${storageKey}', 'true');
            window.location.reload();
        } catch(err) { /* sessionStorage недоступен */}
    };
`
    .replace(/(\r\n|\n|\r|)/gm, '')
    .trim()
    .replace(/\s+/g, ' ');

/**
 * Класс, который обеспечивает наличие на тегах script, указывающих на важные ресурсы,
 * обработчиков успешной и безуспешной загрузки.
 * *
 * Была зарегистрирована ошибка в логах, в которой у нас НЕ ЗАГРУЗИЛСЯ
 * RequireJsLoader/config и супурбандл(ы).
 * Причина возникновения неполадки неясна, но было принято решение перезагружать страницу.
 * https://online.sbis.ru/opendoc.html?guid=019e236c-b1c0-4d2a-b4ad-577cbdd0a612
 * *
 * Другой кейс - получать в логах информация о состоянии этих ресурсов в момент возникновения ошибки
 * @private
 */
export class LoadingStatus implements IDataAggregatorModule {
    execute(): Partial<IFullData> | null {
        AppHead.getInstance().createMergeTag(
            'script',
            {
                type: 'text/javascript',
            },
            onErrorHandler
        );

        return null;
    }

    /** Добавляем атрибут для перезагрузки страницы только, если мы не в дебаге и не в wasaby-cli */
    private static _addErrorHandler(attrs: IPageTagAttrs, scriptName: string): void {
        const s3debugCookie = cookie.get('s3debug');
        const isWasabyCLICookie = cookie.get('IsWasabyCLI');
        const isDebug = s3debugCookie !== 'false' && !!s3debugCookie;
        const isWasabyCLI = isWasabyCLICookie !== 'false' && !!isWasabyCLICookie;

        if (isDebug || isWasabyCLI) {
            return;
        }

        attrs.onerror = `onErrorHandler('${scriptName}')`;
    }

    /** Навешаем на тег script, атрибуты onload и onerror. Они нужны для диагностики и автоперезагрузки */
    static addLoadHandlers(attrs: IPageTagAttrs, scriptName: string): IPageTagAttrs {
        LoadingStatus._addErrorHandler(attrs, scriptName);

        return attrs;
    }
}
