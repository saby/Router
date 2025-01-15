import {
    IDataAggregatorModule,
    IRenderOptions,
    IFullData,
} from 'Router/_Builder/_Bootstrap/Interface';
import { createWsConfig } from 'UI/Head';

export class WsConfig implements IDataAggregatorModule {
    execute(options: IRenderOptions): Partial<IFullData> | null {
        createWsConfig(options);

        return null;
    }
}
