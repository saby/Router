import * as AppEnv from 'Application/Env';
import { Head as AppHead } from 'Application/Page';
import {
    IDataAggregatorModule,
    IRenderOptions,
    IFullData,
} from 'Router/_Builder/_Bootstrap/Interface';

/**
 * Скрипты мониторинга
 * @private
 */
export class Monitoring implements IDataAggregatorModule {
    execute(_: IRenderOptions): Partial<IFullData> | null {
        const HeadAPI = AppHead.getInstance();

        const errorMonitoringScript = AppEnv.getStore('ErrorMonitoringScript') || '';
        // В случае, если в хранилище ничего нет, придет дефолтный IStore, а мы хотим все-же строку
        if (!!errorMonitoringScript && typeof errorMonitoringScript === 'string') {
            HeadAPI.createMergeTag('script', { type: 'text/javascript' }, errorMonitoringScript);
        }

        const CDNMonitoringScript = AppEnv.getStore('CDNMonitoringScript') || '';
        // В случае, если в хранилище ничего нет, придет дефолтный IStore, а мы хотим все-же строку
        if (!!CDNMonitoringScript && typeof CDNMonitoringScript === 'string') {
            HeadAPI.createMergeTag('script', { type: 'text/javascript' }, CDNMonitoringScript);
        }

        return null;
    }
}
