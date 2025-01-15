import {
    IDataAggregatorModule,
    ICollectedDeps,
    IRenderOptions,
    IFullData,
} from 'Router/_Builder/_Bootstrap/Interface';

export class Other implements IDataAggregatorModule {
    execute(options: IRenderOptions, deps: ICollectedDeps): Partial<IFullData> | null {
        return {
            requiredModules: deps.requiredModules,
            isCanceledRevive: options.isCanceledRevive,
            prerender: options.prerender,
        };
    }
}
