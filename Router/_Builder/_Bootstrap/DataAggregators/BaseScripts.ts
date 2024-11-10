import {
    IDataAggregatorModule,
    IRenderOptions,
    IFullData,
} from 'Router/_Builder/_Bootstrap/Interface';
import { JSLinks as AppJSLinks } from 'Application/Page';
import { getResourceUrl } from 'UI/Utils';
import { getOptionalBundles } from 'UI/Deps';
import { TagMarkup, fromJML } from 'UI/Base';
import { LoadingStatus } from 'Router/_Builder/_Bootstrap/DataAggregators/LoadingStatus';

const BASE_DEPS_NAMESPACE: string = 'baseDeps';

// Базовые скрипты, которые необходимо отфильтровать из списка остальных js зависимостей страницы
export const FILTER_BASE_DEPS = ['bundles', 'contents', 'router', 'RequireJsLoader/config'];

const generateSelectedScripts: (
    API: AppJSLinks,
    options: IRenderOptions,
    currentScripts: Record<string, string>,
    rootName: 'resourceRoot' | 'metaRoot'
) => void = (API, options, currentScripts, rootName) => {
    let rawUrl: string;
    let src: string;
    for (const scriptsKey in currentScripts) {
        if (currentScripts.hasOwnProperty(scriptsKey)) {
            rawUrl = `${currentScripts[scriptsKey]}.js`;
            src = rawUrl.startsWith('/')
                ? getResourceUrl(rawUrl)
                : getResourceUrl(options[rootName] + rawUrl);

            API.createTag(
                'script',
                LoadingStatus.addLoadHandlers(
                    {
                        type: 'text/javascript',
                        key: scriptsKey,
                        src,
                    },
                    scriptsKey
                )
            );
        }
    }
};

export class BaseScripts implements IDataAggregatorModule {
    execute(options: IRenderOptions): Partial<IFullData> | null {
        const API = AppJSLinks.getInstance(BASE_DEPS_NAMESPACE);

        /*
         * Корневые ресурсы запрашиваются несколько иначе, нежели помодульные, поскольку данные мета-файлы
         * не привязаны ни к какому интерфейсному модулю, поэтому они будут спрашиваться с отдельного сервиса.
         * Если metaRoot не задан в опциях, по умолчанию он задан как resourceRoot
         */
        if (!options.metaRoot) {
            options.metaRoot = options.appRoot ? `${options.appRoot}resources/` : '/resources/';
        }

        generateSelectedScripts(API, options, { bundles: 'bundles' }, 'metaRoot');
        const optionalBundles = getOptionalBundles();
        if (optionalBundles) {
            generateSelectedScripts(API, options, optionalBundles, 'resourceRoot');
        }
        generateSelectedScripts(
            API,
            options,
            {
                require: '/cdn/RequireJS/2.3.5-p9/require.min',
                contents: 'contents',
                router: 'router',
            },
            'metaRoot'
        );
        generateSelectedScripts(API, options, { config: 'RequireJsLoader/config' }, 'resourceRoot');

        return {
            // @ts-ignore
            JSLinksAPIBaseData: new TagMarkup(API.getData().map(fromJML), {
                getResourceUrl: false,
            }).outerHTML,
        };
    }
}
