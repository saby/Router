import { IRouter } from 'Router/router';
import { IRenderOptions } from 'Router/Builder';
import { IControlConstructor } from 'UICore/Base';
import { IPageSourceNotFound } from './IPageSource';

type IDefaultControl = IControlConstructor & {
    getDataToRender?: (
        url: string,
        params?: { prerender?: boolean } & IRenderOptions
    ) => Promise<unknown>;
};

/**
 * В модуле, который строится на странице может быть метод getDataToRender.
 * Этот метод вернет данные для страницы.
 * @private
 */
export interface IModuleToRender {
    default: IDefaultControl;
    getDataToRender?: (
        url: string,
        params: { prerender?: boolean } & IRenderOptions,
        Router: IRouter
    ) => Promise<unknown>;
}

/**
 * Интерфейс результата микропроцесса загрузки модуля - если модуль существует и его удалось загрузить
 * @private
 */
export interface IModuleFound {
    loadStatus: 'success';
    module: IModuleToRender;
}

/**
 * Интерфейс результата микропроцесса загрузки модуля - если модуля НЕ существует и его НЕ удалось загрузить
 * @private
 */
export interface IModuleNotFound {
    loadStatus: 'not_found';
    notFound: IPageSourceNotFound;
}
