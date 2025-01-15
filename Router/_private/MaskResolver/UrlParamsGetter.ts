/**
 * Классы для получения параметров из url в зависимости от типа маски
 */

import { logger } from 'Application/Env';
import { MaskType, IMaskType, calculateMaskType } from './MaskType';
import { decodeParam } from './Helpers';
import { UrlParts } from './UrlParts';

const TRAVERSE_KEY = 'traverse';
/**
 * Правило в маске, по которому будет отобрана вся оставшаяся часть маски
 * @example
 * url: /page/some/path
 * mask: /page/*traverse
 * result: { traverse: 'some/path' }
 */
const TRAVERSE = `*${TRAVERSE_KEY}`;

/**
 * Интерфейс параметров url адреса
 * @private
 */
export interface IParam {
    maskId: string; // идентификатор параметра из маски, param/:valueId -> valueId
    urlValue: string; // значение параметра из url, /param/value -> value
    urlId?: string; // название параметра в url, /param/value -> param
}

/**
 * Класс для получения параметров из url адреса, в зависимости от типа маски и url адреса
 * @private
 */
export class UrlParamsGetter {
    private readonly urlParts: UrlParts;
    private readonly maskTypes: IMaskType[];
    constructor(mask: string, url: string) {
        this.urlParts = new UrlParts(url);
        this.maskTypes = calculateMaskType(mask, this.urlParts);
    }

    get(): Record<string, string> {
        let params: IParam[] = [];
        this.maskTypes.forEach((maskType) => {
            switch (maskType.maskType) {
                case MaskType.Path:
                    params = [
                        ...params,
                        ...PathParams.calculateParams(maskType.mask, this.urlParts.getPath()),
                    ];
                    break;
                case MaskType.Query:
                    params = [
                        ...params,
                        ...QueryParams.createQueryObject().calculateParams(
                            maskType.mask,
                            this.urlParts.getQuery()
                        ),
                    ];
                    break;
                case MaskType.PathFragment:
                    params = [
                        ...params,
                        ...PathParams.calculateParams(maskType.mask, this.urlParts.getFragment()),
                    ];
                    break;
                case MaskType.QueryFragment:
                    params = [
                        ...params,
                        ...QueryParams.createFragmentObject().calculateParams(
                            maskType.mask,
                            this.urlParts.getFragment()
                        ),
                    ];
                    break;
            }
        });
        const urlParams: Record<string, string> = {};
        params.forEach((param) => {
            if (param.maskId) {
                urlParams[param.maskId] = decodeParam(param.urlValue);
            }
        });
        return urlParams;
    }
}

/**
 * Класс для получения параметров из url адреса типа /param/value или /path#param/value
 * @private
 */
export class PathParams {
    /**
     * Вычислить параметры из url по переданной маске
     * @param mask  маска, по которой разбирается url
     * @param urlPart   часть url адреса, /path/param/value
     */
    static calculateParams(mask: string, urlPart: string): IParam[] {
        const params: IParam[] = [];
        const urlPartsArray: string[] = urlPart.replace(/^\//, '').split(/[#\/]/);
        PathParams._parseMask(mask).forEach((maskIds: string[], urlId: string) => {
            const { urlValues, urlIdIndex } = PathParams._getUrlValue(
                urlPartsArray,
                urlId,
                maskIds.length
            );

            maskIds.forEach((maskId: string, index: number) => {
                if (maskId === TRAVERSE) {
                    let urlValue: string;
                    if (urlIdIndex && urlIdIndex >= 0) {
                        urlValue = [urlValues[index], ...urlPartsArray.slice(urlIdIndex)].join('/');
                    } else {
                        urlValue = [urlValues[index], ...urlPartsArray].join('/');
                    }
                    params.push({
                        maskId: TRAVERSE_KEY,
                        urlValue,
                        urlId: undefined,
                    });
                    return;
                }

                const curParam: IParam = {
                    maskId,
                    urlValue: urlValues[index],
                    urlId: index === 0 ? urlId : undefined,
                };
                params.push(curParam);
            });
        });

        return params;
    }

    /**
     * Разбивает маску по параметрам.
     * Маска вида /page/:id превратится в объект {'page': ['id']}
     * Маска вида /page/:pageId/:id превратится в объект {'page': ['pageId', 'id']}
     * Маска вида /:id превратится в объект {undefined: ['id']}
     * @param mask
     * @returns
     */
    protected static _parseMask(mask: string): Map<string, string[]> {
        const maskParts = mask.split(/[#/]/);
        const maskPartsMap: Map<string, string[]> = new Map();
        let urlId: string;
        let hasTraverse = false;
        maskParts.forEach((item) => {
            if (!item) {
                return;
            }

            if (hasTraverse) {
                logger.error(
                    'Правило маски "*traverse" необходимо для получения хвоста url-адреса. ' +
                        'Нельзя в маске после него задавать другие правила маски!'
                );
                return;
            }

            if (!item.startsWith(':') && item !== TRAVERSE) {
                maskPartsMap.set(item, []);
                urlId = item;
                return;
            }

            if (typeof urlId === 'undefined' && !maskPartsMap.has(urlId)) {
                maskPartsMap.set(urlId, []);
            }

            if (item === TRAVERSE) {
                // *traverse сохраняем со звездочкой
                maskPartsMap.get(urlId)?.push(item);
                hasTraverse = true;
            } else {
                // :maskId сохраняем без двоеточия
                maskPartsMap.get(urlId)?.push(item.slice(1));
            }
        });
        return maskPartsMap;
    }

    /**
     * Получить значение указанного параметра из части url
     * @param urlPartsArray часть url вида /path/param/value/ разбитый по "/" в массив
     * этот массив меняется по ссылке, т.к. найденные параметры больше не должны участвовать в поиске значений
     * @param urlId название параметра, напр. param
     * @param valuesCount сколько значений необходимо взять из url адреса
     * @private
     */
    protected static _getUrlValue(
        urlPartsArray: string[],
        urlId: string,
        valuesCount: number
    ): { urlValues: string[]; urlIdIndex?: number } {
        let urlValues: string[];
        let urlIdIndex: number | undefined;
        if (typeof urlId === 'undefined') {
            // случай когда mask=/:id и url=/some/url - необходимо получить id=some
            // вырезаем из массива элементов url адреса те, которые подходят под текущую маску
            urlValues = urlPartsArray.splice(0, valuesCount);
        } else {
            urlIdIndex = urlPartsArray.indexOf(urlId);
            if (!urlPartsArray.length || urlIdIndex < 0) {
                return { urlValues: [] };
            }

            // вырезаем из массива элементов url адреса те, которые подходят под текущую маску
            urlValues = urlPartsArray.splice(urlIdIndex, valuesCount + 1);
            // удаление первого элемента, т.к. это название параметра в url
            urlValues.splice(0, 1);
        }

        // первое значение всегда должно быть пустой строкой - просто так сложилось
        if (!urlValues.length) {
            return { urlValues: [''] };
        }

        return { urlValues, urlIdIndex };
    }
}

/**
 * Класс для получения параметров из url адреса типа /path/?param=value или /path#param=value
 * @private
 */
export class QueryParams {
    private readonly queryStringParams: QueryStringParams;

    constructor(queryStringParams: QueryStringParams) {
        this.queryStringParams = queryStringParams;
    }

    /**
     * Вычислить параметры из url по переданной маске
     * @param mask  маска, по которой разбирается url
     * @param urlPart   часть url адреса, ?param=value, из которой достаются значения
     */
    calculateParams(mask: string, urlPart: string): IParam[] {
        // маска вида query1=:qId1&query3=:qId3 разбивается в объект {query1: 'qId1', query3: 'qId3'}
        const maskParams: Record<string, string> =
            this.queryStringParams.getParamsFromQueryMaskString(mask);
        // url вида ?query1=value1&query2=value2 разбивается в объект {query1: 'value1', query2: 'value2'}
        const urlParams: Record<string, string> =
            this.queryStringParams.getParamsFromQueryString(urlPart);
        const params: IParam[] = [];
        const calculatedFields: string[] = [];

        [urlParams, maskParams].forEach((data) => {
            for (const urlId in data) {
                if (!data.hasOwnProperty(urlId) || calculatedFields.indexOf(urlId) > -1) {
                    continue;
                }
                params.push({
                    maskId: maskParams[urlId],
                    urlValue: urlParams[urlId],
                    urlId,
                });
                calculatedFields.push(urlId);
            }
        });
        return params;
    }

    /**
     * Создает instance класса для работы с query частью url-адреса
     */
    static createQueryObject(): QueryParams {
        return new QueryParams(QueryStringParams.createQueryObject());
    }

    /**
     * Создает instance класса для работы с query-fragment частью url-адреса
     */
    static createFragmentObject(): QueryParams {
        return new QueryParams(QueryStringParams.createFragmentObject());
    }
}

/**
 * Из query или query-fragment части url'а вида query=value достает все параметры и возвращает в виде объекта
 * @param input
 */
class QueryStringParams {
    private readonly splitRegexp: RegExp;

    constructor(splitRegexp: RegExp) {
        this.splitRegexp = splitRegexp;
    }

    /**
     * Строка вида ?query1=value1&query2=value2 разбивается в объект {query1: 'value1', query2: 'value2'}
     * Строка вида #query1=value1&query2=value2 разбивается в объект {query1: 'value1', query2: 'value2'}
     * @param input
     */
    getParamsFromQueryString(input: string): Record<string, string> {
        return this._getQueryParams(input, (value) => {
            return value;
        });
    }

    /**
     * Строка вида ?query1=:qId1&query3=:qId3 разбивается в объект {query1: 'qId1', query3: 'qId3'}
     * Строка вида #query1=:qId1&query3=:qId3 разбивается в объект {query1: 'qId1', query3: 'qId3'}
     * @param input
     */
    getParamsFromQueryMaskString(input: string): Record<string, string> {
        return this._getQueryParams(input, (value) => {
            return value.indexOf(':') === 0 ? value.slice(1) : value;
        });
    }

    /**
     * Разбивка строки на объект
     * @param input
     * @param getValue
     * @private
     */
    private _getQueryParams(
        input: string,
        getValue: (value: string) => string
    ): Record<string, string> {
        const params: Record<string, string> = {}; // параметры из входной строки
        const urlFields: string[] = input.split(this.splitRegexp);
        for (let i = 0; i < urlFields.length; i++) {
            if (!urlFields[i]) {
                continue;
            }
            if (urlFields[i].indexOf('=') === -1) {
                continue;
            }
            const field: string[] = urlFields[i].split('=');
            params[field[0]] = getValue(field[1]);
        }
        return params;
    }

    private static readonly QUERY_REGEXP: RegExp = /[?&]/;
    private static readonly FRAGMENT_REGEXP: RegExp = /[#&]/;

    /**
     * Создает instance класса для работы с query частью url-адреса
     */
    static createQueryObject(): QueryStringParams {
        return new QueryStringParams(QueryStringParams.QUERY_REGEXP);
    }

    /**
     * Создает instance класса для работы с query-fragment частью url-адреса
     */
    static createFragmentObject(): QueryStringParams {
        return new QueryStringParams(QueryStringParams.FRAGMENT_REGEXP);
    }
}
