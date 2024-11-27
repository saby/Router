import { Head as AppHead } from 'Application/Page';
import {
    IDataAggregatorModule,
    IRenderOptions,
    IFullData,
} from 'Router/_Builder/_Bootstrap/Interface';

/**
 * Фавиконка. Эта микротаска используется только, если выполняется так называемый быстрый запрос за данными
 * Актуально для Google Chrome, например
 * https://online.sbis.ru/opendoc.html?guid=9a500336-5855-4d08-9c69-b27a54ff2e37
 * @private
 */

export class FavIcon implements IDataAggregatorModule {
    execute(options: IRenderOptions): Partial<IFullData> | null {
        const favicon = options.pageConfig
            ? (options.pageConfig.favicon as string)
            : '/cdn/SabyLogo/1.0.7/favicon/favicon.ico?v=1';

        AppHead.getInstance().createTag('link', {
            rel: 'shortcut icon',
            href: favicon,
            type: 'image/x-icon',
        });

        return null;
    }
}
