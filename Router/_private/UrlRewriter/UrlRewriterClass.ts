import { IUrlRewriter } from './IUrlRewriter';

const httpRE: RegExp = /^http[s]?:\/\//;
const multiSlash: RegExp = /\/{2,}/g;
const startSlash: RegExp = /^\//;
const finishSlash: RegExp = /\/$/;

export type TRouteTreeNode = Record<string, IRouteTreeNode>;
export interface IRouteTreeNode {
    value?: string;
    tree: TRouteTreeNode;
}

export interface IRouteTree extends IRouteTreeNode {
    rootRoute: string | null;
}

interface ISplitPath {
    path: string;
    misc: string;
}

export class UrlRewriterClass implements IUrlRewriter {
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
    get(originalUrl: string, returnUndefined: boolean = false): string | undefined {
        const result = _getBestMatchFromRouteTree(originalUrl, this.routeTree);
        if (returnUndefined) {
            return result;
        }
        return result ?? originalUrl;
    }

    /**
     * Отменяет модификацию URL-адреса, возвращая его в исходный вид, заменяя префикс на исходный,
     * на основе конфигурации в файле router.json (значение -> ключ)
     * @param rewrittenUrl URL для восстановления
     * @returns исходный URL
     */
    getReverse(rewrittenUrl: string, returnUndefined: boolean = false): string | undefined {
        const result = _getBestMatchFromRouteTree(rewrittenUrl, this.reverseRouteTree);
        if (returnUndefined) {
            return result;
        }
        return result ?? rewrittenUrl;
    }
}

function _getBestMatchFromRouteTree(url: string, rootNode: IRouteTree): string | undefined {
    const { path, misc }: ISplitPath = _splitQueryAndHash(url);

    if (path === '/' && rootNode && rootNode.rootRoute) {
        return rootNode.rootRoute + misc;
    }

    if (!rootNode || !rootNode.tree || !Object.keys(rootNode.tree).length) {
        return;
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
    const urlParts: string[] = getPath(path).split('/');
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
        return;
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
export function getPath(url: string): string {
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
