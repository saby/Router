import { ModulesManager } from 'RequireJsLoader/conduct';
import { isModuleExists } from 'UI/Deps';
import { PageSourceStatus } from './Interfaces/IPageSource';
import { IModuleFound, IModuleNotFound, IModuleToRender } from './Interfaces/IModuleLoader';

/**
 * Класс для проверки существования модуля и его последующей загрузки
 * @private
 */
export class ModuleLoader {
    /**
     * Загрузка модуля, для которого будет построение страницы
     * @returns
     */
    load(moduleName: string): IModuleNotFound | IModuleFound {
        /* Нужно проверять наличие модуля, перед запросом через require.
         * Иначе будет уязвимость с производительностью, потому что могут передать в адресе мусор
         * https://online.sbis.ru/opendoc.html?guid=76a641dd-1f2a-497a-aa2b-a7f102da5735
         */
        if (!isModuleExists(moduleName)) {
            return {
                loadStatus: 'not_found',
                notFound: {
                    status: PageSourceStatus.NOT_FOUND,
                    error: new Error(`Модуля с названием ${moduleName} не существует.`),
                },
            };
        }

        const modulesManager = new ModulesManager();
        let module: IModuleToRender;
        try {
            module = modulesManager.loadSync(moduleName);
        } catch (error) {
            modulesManager.unloadSync(moduleName);
            return {
                loadStatus: 'not_found',
                notFound: {
                    status: PageSourceStatus.NOT_FOUND,
                    error: error as Error,
                },
            };
        }

        if (!module) {
            // в этой точке модуля может не быть, если в нём есть циклическая зависисмость
            return {
                loadStatus: 'not_found',
                notFound: {
                    status: PageSourceStatus.NOT_FOUND,
                    error: new Error(
                        `Require вернул undefined при загрузке модуля ${moduleName}.` +
                            'Необходимо проверить модуль на предмет циклической зависимости.'
                    ),
                },
            };
        }

        return {
            loadStatus: 'success',
            module,
        };
    }
}
