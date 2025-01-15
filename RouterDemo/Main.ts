/**
 * @author Мустафин Л.И.
 */

import { Control, TemplateFunction } from 'UI/Base';
import * as template from 'wml!RouterDemo/Main';

/**
 * Точка входа для демонстрации роутинга
 */

export default class Main extends Control {
    protected _template: TemplateFunction = template;
    protected _getDataToRender = (url: string) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({ url });
            }, 500);
        });
    };
    static _styles: string[] = ['RouterDemo/Main'];
}
