import { IFullData, IRenderOptions, IDataAggregatorModule, IBuilderExtraInfo } from './Interface';
import { addPageDeps, collectDependencies } from 'UI/Deps';

export class DataAggregator {
    private _modules: IDataAggregatorModule[] = [];

    constructor(private _moduleName: string, private _options: IRenderOptions) {}

    add(module: IDataAggregatorModule): DataAggregator {
        this._modules.push(module);

        return this;
    }

    /**
     * @param extraInfo мета информация (bundlesRoute и module-dependencies) от билдера при генерации
     *                  статичных страниц. Этот аргумент используется при генерации статичных страниц *html.tmpl
     */
    getData(extraInfo?: IBuilderExtraInfo): Partial<IFullData> {
        addPageDeps([this._moduleName]);
        let staticPageBundles;
        if (extraInfo && extraInfo.moduleDependencies && extraInfo.bundlesRoute) {
            staticPageBundles = {
                links: extraInfo.moduleDependencies.links,
                nodes: extraInfo.moduleDependencies.nodes,
                bundles: extraInfo.bundlesRoute,
            };
        }
        const deps = collectDependencies(staticPageBundles);

        let result = {};

        this._modules.forEach((module) => {
            result = {
                ...result,
                ...(module.execute(this._options, deps) || {}),
            };
        });

        return result;
    }
}
