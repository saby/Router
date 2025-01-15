import { Control, TemplateFunction } from 'UI/Base';
import template = require('wml!RouterTest/resources/Index');

export default class extends Control {
    _template: TemplateFunction = template;

    static getDataToRender(url: string): Promise<{}> {
        return Promise.resolve({ url });
    }
}

export function getDataToRender(url: string): Promise<{}> {
    return Promise.resolve({ url });
}
