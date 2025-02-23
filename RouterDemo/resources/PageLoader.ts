import { Control, IControlOptions, TemplateFunction } from 'UI/Base';
import { isLoaded, loadAsync, loadSync } from 'WasabyLoader/ModulesLoader';
import template = require('wml!RouterDemo/resources/PageLoader');
import emptyPage = require('wml!RouterDemo/resources/EmptyPage');

interface IOptions extends IControlOptions {
    pageId: string;
}
/**
 * Загрузчик страниц, используется в {@link RouterDemo/Main}
 */
export default class PageLoader extends Control<IOptions> {
    protected _template: TemplateFunction = template;

    protected pageClassLoaded: Function = emptyPage;

    _beforeMount(options: IOptions): void {
        this._changePage(options.pageId);
    }

    _beforeUpdate(options: IOptions): void {
        if (this._options.pageId !== options.pageId) {
            const res = this._changePage(options.pageId);
            if (!res || !res.then) {
                this._forceUpdate();
                return;
            }
            res.then(() => {
                this._forceUpdate();
            });
        }
    }

    private _changePage(newPage: String): Promise<void> | void {
        const moduleName = 'RouterDemo/resources/' + newPage;
        if (isLoaded(moduleName)) {
            this.pageClassLoaded = loadSync(moduleName);
            return;
        }
        return loadAsync<Function>(moduleName).then((newPageClass: Function) => {
            this.pageClassLoaded = newPageClass;
        });
    }
}
