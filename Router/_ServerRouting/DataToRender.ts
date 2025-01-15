import { logger } from 'Application/Env';
import { IRouter } from 'Router/router';
import { IRenderOptions } from 'Router/Builder';
import { IModuleToRender } from './Interfaces/IModuleLoader';
import { IDataToRenderNotExist } from './Interfaces/IPageSourceData';

// таймаут ожиданию предзагрузки данных для страницы
export const GET_DATA_TIMEOUT = 23000;

/**
 *
 * @private
 */
export class DataToRender {
    constructor(private _prerender: boolean = false) {}

    /**
     * предзагрузка данных для страницы
     * @param module
     * @param url
     */
    get(
        module: IModuleToRender,
        url: string,
        moduleName: string,
        options: IRenderOptions
    ): Promise<IDataToRenderNotExist | unknown> {
        const getDataToRender = module.getDataToRender ?? module.default?.getDataToRender;
        if (typeof getDataToRender !== 'function') {
            return Promise.resolve({ getDataToRender: false });
        }

        // Promise для ограничения по времени вызов метода предзагрузки данных
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(reject, GET_DATA_TIMEOUT);
        });

        return Promise.race([
            getDataToRender(
                url,
                { ...options, prerender: this._prerender },
                options.Router as IRouter
            ),
            timeoutPromise,
        ])
            .then((pageConfig: unknown) => {
                return pageConfig;
            })
            .catch((error) => {
                if (error) {
                    logger.error(
                        'Router/ServerRouting',
                        `Error when loading data for module ${moduleName}: ` + error.message,
                        error
                    );
                } else {
                    error = new Error(
                        `Timeout error while loading data for module ${moduleName}, url: ${url}`
                    );
                    logger.warn('Router/ServerRouting', error.message);
                }
                return { error };
            });
    }
}
