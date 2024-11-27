import { logger } from 'Application/Env';
import UrlRewriter from './UrlRewriter';
import { UrlParamsGetter } from './MaskResolver/UrlParamsGetter';
import {
    UrlQueryModifier,
    UrlModifier,
    IUrlParams,
    IUrlQueryParams,
} from './MaskResolver/UrlModifier';
import RouterUrl from './Router/RouterUrl';

/**
 * Получает название контрола, которое необходимо построить в зависимости от заданного url и router.json
 * @private
 */
export function getAppNameByUrl(url: string): string {
    let _url;
    try {
        _url = decodeURIComponent(url);
    } catch (err) {
        logger.error('Ошибка при обработке строки URI - ' + (err as Error).message, err);
        _url = url;
    }

    let folderName: string = UrlRewriter.getInstance().get(_url) || '';

    // Folder name for url '/sign_in?return=mainpage' should be 'sign_in'
    if (folderName.indexOf('?') !== -1) {
        folderName = folderName.replace(/\?.*/, '');
    }

    // Folder name for url '/news#group=testGroup' should be 'news'
    if (folderName.indexOf('#') !== -1) {
        folderName = folderName.replace(/#.*/, '');
    }

    // Folder name for '/Tasks/onMe' is 'Tasks', but folder name for
    // 'tasks.html' is 'tasks.html'
    if (folderName.indexOf('/') !== -1) {
        folderName = folderName.split('/')[1];
    }

    return folderName + '/Index';
}

/**
 * Интерфейс класса с набором методов обеспечивающих работу с масками и параметрами URL.
 * @public
 * @author Мустафин Л.И.
 */
export interface IMaskResolver {
    /**
     * Извлекает значения из текущего адреса по заданной маске.
     * @param mask Параметризованная маска, напр. "/doc/:guid?tab=:tabId". Подробнее о масках читайте <a href="/doc/platform/developmentapl/interface-development/routing/mask-and-syntax/">здесь</a>.
     * @param currentUrl Адрес, из которого будут извлекаться значения. По умолчанию используется текущий URL.
     * @returns Объект, в котором ключи - названия параметров, а значения - значения параметров.
     * @public
     */
    calculateUrlParams(mask: string, currentUrl?: string): Record<string, string>;
    /**
     * Вычисляет новый URL-адрес, применяя к текущему маску и значения параметров для ее заполнения.
     * @param mask Параметризованная маска, напр. "/doc/:guid?tab=:tabId". Подробнее о масках читайте <a href="/doc/platform/developmentapl/interface-development/routing/mask-and-syntax/">здесь</a>.
     * @param cfg Объект со значениями параметров, используемых в маске.
     * @param currentUrl Url адрес, с которым будет работать метод. Необязательный параметр.
     * @returns Вычисленный адрес.
     * @public
     */
    calculateHref(mask: string, cfg: Partial<IUrlParams>, currentUrl?: string): string;
    /**
     * Вычисляет новый URL-адрес, применяя к текущему/переданному url адресу значения из входного объекта.
     * Модифицируется только query-часть url адреса.
     * @param cfg Объект со значениями query параметров, которые необходимо добавить в url адрес.
     * Если передать clearFragment: true, то из url адреса будет удален <a href="/doc/platform/developmentapl/interface-development/routing/mask-and-syntax/#mask-types">fragment</a>.
     * @param currentUrl Url адрес, с которым будет работать метод. Необязательный параметр.
     * @returns Вычисленный адрес.
     * @public
     */
    calculateQueryHref(cfg: Partial<IUrlQueryParams>, currentUrl?: string): string;
}

/**
 * Набор методов обеспечивающих работу с масками и параметрами URL
 * @author Мустафин Л.И.
 * @private
 */
export default class MaskResolver implements IMaskResolver {
    constructor(private _urlRewriter: UrlRewriter, private _routerUrl: RouterUrl) {}

    /**
     * Извлекает значения из текущего адреса по заданной маске.
     * @param mask Параметризованная маска, напр. "/doc/:guid?tab=:tabId". Подробнее о масках читайте <a href="/doc/platform/developmentapl/interface-development/routing/mask-and-syntax/">здесь</a>.
     * @param currentUrl Адрес, из которого будут извлекаться значения. По умолчанию используется текущий URL.
     * @returns Объект, в котором ключи - названия параметров, а значения - значения параметров.
     * @public
     */
    calculateUrlParams(mask: string, currentUrl?: string): Record<string, string> {
        const url = currentUrl || this._urlRewriter.get(this._routerUrl.getStateUrl());
        const getter: UrlParamsGetter = new UrlParamsGetter(mask, url);
        return getter.get();
    }

    /**
     * Вычисляет новый URL-адрес, применяя к текущему маску и значения параметров для ее заполнения.
     * @param mask Параметризованная маска, напр. "/doc/:guid?tab=:tabId". Подробнее о масках читайте <a href="/doc/platform/developmentapl/interface-development/routing/mask-and-syntax/">здесь</a>.
     * @param cfg Объект со значениями параметров, используемых в маске.
     * @param currentUrl Url адрес, с которым будет работать метод. Необязательный параметр.
     * @returns Вычисленный адрес.
     * @public
     */
    calculateHref(mask: string, cfg: Partial<IUrlParams>, currentUrl?: string): string {
        const url = currentUrl || this._urlRewriter.get(this._routerUrl.getStateUrl());
        const modifier: UrlModifier = new UrlModifier(mask, cfg, url);
        return modifier.modify();
    }

    /**
     * Вычисляет новый URL-адрес, применяя к текущему/переданному url адресу значения из входного объекта.
     * Модифицируется только query-часть url адреса.
     * @param cfg Объект со значениями query параметров, которые необходимо добавить в url адрес.
     * Если передать clearFragment: true, то из url адреса будет удален <a href="/doc/platform/developmentapl/interface-development/routing/mask-and-syntax/#mask-types">fragment</a>.
     * @param currentUrl Url адрес, с которым будет работать метод. Необязательный параметр.
     * @returns Вычисленный адрес.
     * @public
     */
    calculateQueryHref(cfg: Partial<IUrlQueryParams>, currentUrl?: string): string {
        const url = currentUrl || this._urlRewriter.get(this._routerUrl.getStateUrl());
        const modifier: UrlQueryModifier = new UrlQueryModifier(cfg, url);
        return modifier.modify();
    }
}
