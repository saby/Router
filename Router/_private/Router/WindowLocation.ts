import { ILocation } from 'Application/Interface';
import { UrlParts } from '../MaskResolver/UrlParts';

/**
 * Интерфейс заглушки-location для создания внутри роутера при работе роутера в приложении на панели
 * @private
 */
export interface IWindowLocation extends ILocation {
    _update(url: string): void;
}

/**
 * Класс-заглушка для window.location внутри роутера при работе роутера в приложении на панели
 * @private
 */
export default class WindowLocation implements IWindowLocation {
    protocol: string = '';
    host: string = '';
    hostname: string = '';
    port: string = '';
    href: string = '';
    pathname: string = '';
    search: string = '';
    hash: string = '';

    constructor(initialUri: string = '/') {
        this._update(initialUri || '/');
    }

    replace(): void {}

    _update(url: string): void {
        const urlParts = new UrlParts(url);
        this.pathname = urlParts.getPath();
        this.search = urlParts.getQuery();
        this.hash = urlParts.getFragment();
        this.href = url;
    }
}
