import { IPageSourceNotFound } from './IPageSource';

/**
 * Интерфейс итогового результата когда отсутствует метод getDataToRender
 * Тогда выставим следующий флаг
 * @private
 */
export interface IDataToRenderNotExist {
    getDataToRender: false;
}

/**
 * Интерфейс успешного результата процесса загрузки модуля и предзагрузки данных
 * @private
 */
export interface IPageSourceDataOK {
    hasData: true;
    moduleName: string;
    prerender?: boolean;
    dataToRender: Promise<IDataToRenderNotExist | unknown>;
}

/**
 * Интерфейс НЕ успешного результата процесса загрузки модуля и предзагрузки данных
 * @private
 */
export interface IPageSourceDataNotOK {
    hasData: false;
    notFound: IPageSourceNotFound;
}

export type TPageSourceData = IPageSourceDataOK | IPageSourceDataNotOK;
