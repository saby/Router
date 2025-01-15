import { Control, TemplateFunction } from 'UI/Base';
import { createNewRouter, IRouter } from 'Router/router';
import template = require('wml!RouterDemo/resources/AppInPage');
import 'css!RouterDemo/resources/AppInPage';

/**
 * Демонстрация работы Router.router:Route для вставки приложения в приложение
 */

export default class AppInPage extends Control {
    protected _template: TemplateFunction = template;
    protected _showRoute: boolean = false;
    protected _newRouter?: IRouter;

    protected _toggleRoute(): void {
        if (!this._showRoute) {
            this._newRouter = createNewRouter('/RouterDemo');
        } else {
            delete this._newRouter;
        }
        this._showRoute = !this._showRoute;
    }
}
