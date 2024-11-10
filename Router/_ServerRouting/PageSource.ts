/**
 *
 * @author Мустафин Л.И.
 */

import { query } from 'Application/Env';
import { mainRender, IRenderOptions, IPageConfig } from 'Router/Builder';
import { TPageSourceData } from './Interfaces/IPageSourceData';
import { PageSourceStatus, TPageSource } from './Interfaces/IPageSource';

/**
 * Класс призван генерировать html-код страницы используя данные, полученные после работы класса PageSourceData
 * @private
 */
export class PageSource {
    /**
     * Формирование итогового ответа с готовым html или с ошибкой
     * @param onSuccessHandler
     * @param onNotFoundHandler
     * @returns
     */
    render(
        options: IRenderOptions,
        renderData: TPageSourceData,
        onSuccessHandler: (html: string) => void,
        onNotFoundHandler: (error: Error) => void,
        onErrorHandler?: (error: Error) => void
    ): Promise<TPageSource> {
        const pageSource: Promise<TPageSource> = this.renderPageSource(options, renderData);

        return pageSource
            .then((result: TPageSource) => {
                switch (result.status) {
                    case PageSourceStatus.OK:
                        onSuccessHandler(result.html);
                        break;
                    case PageSourceStatus.NOT_FOUND:
                    default:
                        onNotFoundHandler(result.error);
                }
                return result;
            })
            .catch((error) => {
                onErrorHandler?.(error);
                return error;
            });
    }

    /**
     * Вызов трехэтапного метода построения верстки используя предзагруженные данные
     * @param options
     * @param renderData
     * @returns Promise<IPageSource>
     */
    private renderPageSource(
        options: IRenderOptions,
        renderData: TPageSourceData
    ): Promise<TPageSource> {
        if (renderData.hasData === false) {
            return Promise.resolve(renderData.notFound);
        }

        return (renderData.dataToRender as Promise<IPageConfig>)
            .then((pageConfig) => {
                if (pageConfig?.stopRender === true) {
                    return;
                }
                return mainRender(renderData.moduleName, {
                    application: renderData.moduleName,
                    ...options,
                    ...{
                        pageConfig,
                        isCanceledRevive: !!query.get.isCanceledRevive,
                        prerender: renderData.prerender,
                    },
                });
            })
            .then((html) => {
                return { status: PageSourceStatus.OK, html: html || '' };
            });
    }
}
