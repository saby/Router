// @ts-ignore
import routerJson = require('router');

const httpRE: RegExp = /^http[s]?:\/\//;
const multiSlash: RegExp = /\/{2,}/g;
const startSlash: RegExp = /^\//;
const finishSlash: RegExp = /\/$/;

type RouteEntriesArray = string[][];

type TRouteTreeNode = Record<string, IRouteTreeNode>;
interface IRouteTreeNode {
    value?: string;
    tree: TRouteTreeNode;
}

interface IRouteTree extends IRouteTreeNode {
    rootRoute: string | null;
}

interface ISplitPath {
    path: string;
    misc: string;
}

/**
 * Интерфейс класса реализующего API работы с router.json.
 * @public
 * @author Мустафин Л.И.
 */
export interface IUrlRewriter {
    /**
     * Модифицирует переданный URL, заменяя его префикс на основе конфигурации, указанной
     * в файле router.json (ключ -> значение)
     * @param originalUrl URL для модификации
     * @returns модифицированный URL
     */
    get(originalUrl: string): string;
    /**
     * Отменяет модификацию URL-адреса, возвращая его в исходный вид, заменяя префикс на исходный,
     * на основе конфигурации в файле router.json (значение -> ключ)
     * @param rewrittenUrl URL для восстановления
     * @returns исходный URL
     */
    getReverse(rewrittenUrl: string): string;
}

/**
 * Набор методов для работы с router.json, в котором можно задать соответствие
 * между текущим путем и его короткой записью - "красивым" URL
 * @public
 * @author Мустафин Л.И.
 */
export default class UrlRewriter implements IUrlRewriter {
    /**
     * дерево соответствий маршрутов полученное из router.json
     */
    private routeTree: IRouteTree;
    /**
     * дерево обратных (перевернутых) соответствий маршрутов полученное из router.json
     */
    private reverseRouteTree: IRouteTree;

    constructor(routes: { routeTree: IRouteTree; reverseRouteTree: IRouteTree }) {
        this.routeTree = routes.routeTree;
        this.reverseRouteTree = routes.reverseRouteTree;
    }

    /**
     * Модифицирует переданный URL, заменяя его префикс на основе конфигурации, указанной
     * в файле router.json (ключ -> значение)
     * @param originalUrl URL для модификации
     * @returns модифицированный URL
     */
    get(originalUrl: string): string {
        return _getBestMatchFromRouteTree(originalUrl, this.routeTree);
    }

    /**
     * Отменяет модификацию URL-адреса, возвращая его в исходный вид, заменяя префикс на исходный,
     * на основе конфигурации в файле router.json (значение -> ключ)
     * @param rewrittenUrl URL для восстановления
     * @returns исходный URL
     */
    getReverse(rewrittenUrl: string): string {
        return _getBestMatchFromRouteTree(rewrittenUrl, this.reverseRouteTree);
    }

    protected static instance: UrlRewriter;

    /**
     *
     */
    static getInstance(): UrlRewriter {
        if (!UrlRewriter.instance) {
            const routes = _prepareRoutes((routerJson as unknown as Record<string, string>) || {});
            UrlRewriter.instance = new UrlRewriter(routes);
        }
        return UrlRewriter.instance;
    }
}

function _getBestMatchFromRouteTree(url: string, rootNode: IRouteTree): string {
    const { path, misc }: ISplitPath = _splitQueryAndHash(url);

    if (path === '/' && rootNode && rootNode.rootRoute) {
        return rootNode.rootRoute + misc;
    }

    if (!rootNode || !rootNode.tree || !Object.keys(rootNode.tree).length) {
        return url;
    }

    let foundState: string | undefined;
    let lastIndex: number = -1;
    const foundRegexUrlParts: string[] = [];
    const setLastFoundResult = (
        state: string | undefined,
        index: number,
        regexValues: string[] = []
    ) => {
        if (state || regexValues.length) {
            foundState = state;
            lastIndex = index;
            foundRegexUrlParts.push(...regexValues);
        }
    };
    const urlParts: string[] = _getPath(path).split('/');
    let curTreeNode: TRouteTreeNode = rootNode.tree;

    for (let i = 0; i < urlParts.length; i++) {
        const urlPart: string = urlParts[i];

        if (curTreeNode.hasOwnProperty(urlPart)) {
            setLastFoundResult(curTreeNode[urlPart].value, i);
            curTreeNode = curTreeNode[urlPart].tree;
            continue;
        }

        // работа с регулярками
        const { regexValues, state, treeNode } = _getRegExpUrlPart(urlPart, curTreeNode);
        if (!treeNode) {
            break;
        }
        setLastFoundResult(state, i, regexValues);
        curTreeNode = treeNode;
    }

    if (!foundState) {
        return url;
    }

    // дополняем полученный state вида /Module/$1/$2 значениями из URL
    foundRegexUrlParts.forEach((regexValue, index) => {
        // вместо $1,$2,... подставляем полученное из url значение
        foundState = foundState?.replace(`$${index + 1}`, regexValue);
    });
    const urlTail = urlParts.slice(lastIndex + 1).join('/');
    const resultPath = '/' + foundState + (urlTail ? '/' + urlTail : '');
    return resultPath.replace(multiSlash, '/') + misc;
}

/**
 * Обработка ключа в router.json вида "/regex:<validRegex>"
 * Т.е. если у текущей ноды дерева router.json есть ключ с регуляркой, то если текущий кусок url-адреса
 * подходит под эту регулярку, то возвращаем значение этой ноды
 *
 * Напр. есть router.json вида:
 * {
 *    "/": "Module",
 *    "/regex:^([0-9]{5})$": "Module/$1"
 * }
 * Тогда url вида "/12345" будет заменен на "Module/12345". Это означает, что оба случая из этого router.json
 * будут обработаны модулем Module/Index
 *
 * Соотв. в Router.router:Route можно использовать маску вида "Module/:id", как
 * <Router.router:Route mask="Module/:id">
 *     <div>{{ content.id }}</div>
 * </Router.router:Route>
 *
 * @param urlPart
 * @param curTreeNode
 */
function _getRegExpUrlPart(
    urlPart: string,
    curTreeNode: TRouteTreeNode
): {
    regexValues: string[];
    state: string | undefined;
    treeNode: TRouteTreeNode | undefined;
} {
    let regexValues: string[] = [];
    let state: string | undefined;
    let treeNode: TRouteTreeNode | undefined;
    Object.keys(curTreeNode).forEach((key) => {
        if (regexValues.length || state || key.indexOf('regex:') !== 0) {
            return;
        }

        const regexp = new RegExp(key.replace('regex:', ''));
        const match = urlPart.match(regexp);
        if (!match) {
            return;
        }

        regexValues = match.slice(1);
        state = curTreeNode[key].value;
        treeNode = curTreeNode[key].tree;
    });
    return { regexValues, state, treeNode };
}

function _splitQueryAndHash(url: string): ISplitPath {
    const splitMatch = url.match(/[?#]/);
    if (splitMatch) {
        const index: number = splitMatch.index as number;
        return {
            path: url.substring(0, index),
            misc: url.slice(index),
        };
    }
    return {
        path: url,
        misc: '',
    };
}

// get path by url and normalize it
function _getPath(url: string): string {
    let result: string = url.replace(httpRE, '');
    const qIndex: number = result.indexOf('?');
    const pIndex: number = result.indexOf('#');
    if (qIndex !== -1) {
        result = result.slice(0, qIndex);
    }
    if (pIndex !== -1) {
        result = result.slice(0, pIndex);
    }
    result = result.replace(startSlash, '').replace(finishSlash, '');
    return result;
}

/**
 * Превращает конфигурационный файл router.json в дерево маршрутов роутинга.
 * Экспортируется для unit-тестов
 * @param json объект с конфигурацией замен адресов
 * @hidden
 */
export function _prepareRoutes(json: Record<string, string>): {
    routeTree: IRouteTree;
    reverseRouteTree: IRouteTree;
} {
    const entries: RouteEntriesArray = _getEntries(json);
    const routeTree = _buildRouteTree(entries);
    const reverseRouteTree = _buildRouteTree(_reverseEntries(entries));
    return { routeTree, reverseRouteTree };
}

function _buildRouteTree(entries: RouteEntriesArray): IRouteTree {
    const result: IRouteTree = {
        tree: {},
        rootRoute: null,
    };

    entries.forEach((entry) => {
        const routeName: string = entry[0];
        const routeDest: string = entry[1];

        if (routeName === '/') {
            result.rootRoute = '/' + _getPath(routeDest);
            return;
        }

        const routeNameParts: string[] = _getPath(routeName).split('/');

        let curTreeNode: TRouteTreeNode = result.tree;
        routeNameParts.forEach((part, i) => {
            if (!curTreeNode.hasOwnProperty(part)) {
                curTreeNode[part] = {
                    value: undefined,
                    tree: {},
                };
            }
            if (i === routeNameParts.length - 1) {
                if (
                    !curTreeNode[part].value ||
                    (curTreeNode[part].value as string).length > routeDest.length
                ) {
                    curTreeNode[part].value = routeDest;
                }
            }
            curTreeNode = curTreeNode[part].tree;
        });
    });

    return result;
}

function _getEntries(json: Record<string, string>): RouteEntriesArray {
    if (!json) {
        return [];
    }

    const ownProps: string[] = Object.keys(json);
    let i: number = ownProps.length;
    const result: RouteEntriesArray = new Array(i);

    while (i--) {
        result[i] = [ownProps[i], json[ownProps[i]]];
    }

    return result;
}

function _reverseEntries(entries: RouteEntriesArray): RouteEntriesArray {
    return entries.map((entry) => {
        return [entry[1], entry[0]];
    });
}
