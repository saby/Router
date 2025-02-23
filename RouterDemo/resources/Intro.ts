/**
 * @author Мустафин Л.И.
 */

import { Control, TemplateFunction } from 'UI/Base';
import template = require('wml!RouterDemo/resources/Intro');

/**
 * Заглавная страница демонстрации
 */

class Intro extends Control {
    protected _template: TemplateFunction = template;
    protected _preventNavigateMessage: string = '';
    protected _preventNavigate: boolean = false;

    constructor(options: {}) {
        super(options);
        this._onBeforeChange = this._onBeforeChange.bind(this);
    }

    _setPreventNavigate(): void {
        this._preventNavigate = !this._preventNavigate;
        if (!this._preventNavigate) {
            this._preventNavigateMessage = '';
        } else {
            this._preventNavigateMessage = 'SPA переходы заблокированы.';
        }
    }

    protected _onBeforeChange(): Promise<boolean> {
        if (this._preventNavigate) {
            return Promise.resolve(false);
        }
        return Promise.resolve(true);
    }
}

export default Intro;
