import { Control, TemplateFunction, IControlOptions } from 'UI/Base';
import template = require('wml!RouterTest/resources/ReferenceInWml');

export default class ReferenceInWml extends Control {
    protected _template: TemplateFunction = template;

    protected _afterMount(): void {
        this._notify('event');
    }

    static defaultProps: IControlOptions = {
        notLoadThemes: true,
    };
}
