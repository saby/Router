import { loadAsync } from 'WasabyLoader/ModulesLoader';
import { Control, TemplateFunction } from 'UI/Base';
import { addPageDeps } from 'UI/Deps';
import { MaskResolver } from 'Router/router';
import * as template from 'wml!RouterDemo/Index';

/**
 * Точка входа для демонстрации роутинга
 */
export default class Index extends Control {
    protected _template: TemplateFunction = template;
}

export function getDataToRender(url: string): Promise<void> | void {
    const pageId = MaskResolver.calculateUrlParams('/RouterDemo/page/:pageId', url).pageId;
    if (!pageId) {
        return;
    }
    const moduleName = 'RouterDemo/resources/' + pageId;
    return loadAsync(moduleName).then(() => {
        addPageDeps([moduleName]);
        return;
    });
}
