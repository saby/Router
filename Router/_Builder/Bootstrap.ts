import * as ControlsHTMLTemplate from 'wml!Router/_Builder/_Bootstrap/ControlsHTML';
import { logger, getStateReceiver } from 'Application/Env';
import { createTitle, createViewPort } from 'UI/Head';
import { addPageDeps } from 'UI/Deps';
import { render } from './_Bootstrap/HTML';
import { IFullData, IRenderOptions } from './_Bootstrap/Interface';
import { DataAggregator } from './_Bootstrap/DataAggregator';
import { BaseScripts } from './_Bootstrap/DataAggregators/BaseScripts';
import { Head } from './_Bootstrap/DataAggregators/Head';
import { FavIcon } from './_Bootstrap/DataAggregators/FavIcon';
import { Body } from './_Bootstrap/DataAggregators/Body';
import { DefaultTags } from './_Bootstrap/DataAggregators/DefaultTags';
import { JS } from './_Bootstrap/DataAggregators/JS';
import { Other } from './_Bootstrap/DataAggregators/Other';
import { UtilsScripts } from './_Bootstrap/DataAggregators/UtilsScripts';
import { WsConfig } from './_Bootstrap/DataAggregators/WsConfig';
import { Monitoring } from './_Bootstrap/DataAggregators/Monitoring';
import { LoadingStatus } from './_Bootstrap/DataAggregators/LoadingStatus';
// @ts-ignore
import * as ReactDOMServer from 'react-dom/server';

/**
 * Этап 1
 * @param moduleName
 * @param options
 */
export function renderControls(
    moduleName: string,
    options: IRenderOptions
): Promise<string | void> {
    createTitle(options.pageConfig ? options.pageConfig.title || '' : '');
    createViewPort();
    if (options.prerender) {
        return renderControlsForEmptyPage();
    }

    /**
     * Нужно последовательно дождаться двух действий:
     * 1 рендер
     * 2 ожидание получения данных из контролов, который захотели вернуть Promise из _beforeMount
     * *
     * Во втором случае контрол не нарисут свою верстку (ограничения React), но получит receivedState на клиенте,
     * если Promise в _beforeMount успеет отработать за 5 секунд
     */
    return new Promise((resolve, reject) => {
        let renderResult;
        try {
            renderResult = ControlsHTMLTemplate(
                {
                    moduleName,
                    options,
                },
                { key: 'bd_' },
                undefined,
                undefined,
                undefined,
                undefined,
                undefined,
                'throw'
            );
        } catch (error) {
            logger.error('Ошибка при построении html: ', error);

            if ((error as Error).message.indexOf('importScripts failed') > -1) {
                reject(error);
                return;
            }
        }

        Promise.resolve(renderResult).then((controlsHTML) => {
            // не стоит ждать завершения Promise'ов из _beforeMount'ов асинхронных контролов
            // если есть "нормальный" pageConfig
            if (checkSkipAsync(options)) {
                resolve(controlsHTML);
                return;
            }
            const startSerialization = Date.now();
            getStateReceiver()
                .waitBeforeMounts()
                .then(() => {
                    logger.info(
                        `waiting beforeMounts is over in ${Date.now() - startSerialization} ms`
                    );
                    resolve(controlsHTML);
                });
        });
    });
}

/**
 * Этап 1`
 * Незачем тратить время на все дерево контролов, если сейчас выполняется так называемый быстрый запрос за данными
 * Актуально для Google Chrome, например
 * https://online.sbis.ru/opendoc.html?guid=9a500336-5855-4d08-9c69-b27a54ff2e37
 */
function renderControlsForEmptyPage(): Promise<string> {
    return Promise.resolve('');
}

/**
 * Этап 2
 * @param moduleName
 * @param options
 * @param controlsHTML
 */
export function aggregateFullData(
    moduleName: string,
    options: IRenderOptions,
    controlsHTML: string
): IFullData {
    if (options.prerender) {
        return aggregateDataForEmptyPage(moduleName, options, controlsHTML);
    }

    const aggregatedData = new DataAggregator(moduleName, options)
        .add(new WsConfig())
        .add(new Monitoring())
        .add(new LoadingStatus())
        .add(new DefaultTags())
        .add(new Head())
        .add(new Body())
        .add(new BaseScripts())
        .add(new UtilsScripts())
        .add(new JS())
        .add(new Other())
        .getData();

    return {
        ...aggregatedData,
        controlsHTML,
        renderStartTime: options.renderStartTime,
    } as IFullData;
}

/**
 * Этап 2`
 * Незачем тратить время на сбор всех данных, если сейчас выполняется так называемый быстрый запрос за данными
 * Актуально для Google Chrome, например
 * https://online.sbis.ru/opendoc.html?guid=9a500336-5855-4d08-9c69-b27a54ff2e37
 */
function aggregateDataForEmptyPage(
    moduleName: string,
    options: IRenderOptions,
    controlsHTML: string
): IFullData {
    const aggregatedData = new DataAggregator(moduleName, options)
        .add(new DefaultTags())
        .add(new FavIcon())
        .add(new Head())
        .add(new Body())
        .add(new Other())
        .getData();

    return {
        ...aggregatedData,
        ...{ controlsHTML },
    } as IFullData;
}

/**
 * Этап 3
 * @param moduleName
 * @param fullData
 */
function renderHTML(moduleName: string, fullData: IFullData): string {
    return render({ ...fullData, moduleName });
}

export function mainRender(moduleName: string, options: IRenderOptions): Promise<string> {
    if (ReactDOMServer) {
        logger.info('ReactDOMServer loaded');
    }
    return new Promise((pageResolve, reject) => {
        renderControls(moduleName, options)
            .then((controlsHTML: string | void) => {
                const fullData = aggregateFullData(moduleName, options, controlsHTML || '');

                pageResolve(renderHTML(moduleName, fullData));
            })
            .catch(reject);
    });
}

/**
 * Оборачивает <div>...</div> со старыми контролами в HTML
 * Метод вызывается в PresentationService/Service для части страниц из старого роутинга,
 * которые построены через 'wml!UI/Route' - тогда контент будет как <div>...</div>
 * @returns
 */
export function renderHTMLforOldRoutes(
    controlsHTML: string,
    options: IRenderOptions
): Promise<string> {
    if (options.application) {
        // необходимо добавить в зависимости страницы "корневой" модуль
        addPageDeps([options.application]);
    }

    // "такие" страницы в браузере всегда безусловно будет строить UICore/Base:RouteCompatible
    const moduleName = 'UICore/Base:RouteCompatible';

    const startSerialization = Date.now();
    const resulter = () => {
        logger.info(`waiting beforeMounts is over in ${Date.now() - startSerialization} ms`);
        const fullData = aggregateFullData(moduleName, options, controlsHTML);
        return renderHTML(moduleName, fullData);
    };
    return getStateReceiver().waitBeforeMounts().then(resulter, resulter);
}

function checkSkipAsync(options: IRenderOptions) {
    // pageConfig должен быть
    if (!options.pageConfig) {
        return false;
    }
    // этот pageConfig - "нормальный"
    if (
        options.pageConfig.getDataToRender === false &&
        typeof options.pageConfig.error === 'undefined'
    ) {
        return false;
    }

    return true;
}
