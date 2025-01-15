// @ts-ignore
import routerJson = require('router');
import { getStore } from 'Application/Env';
import { get as getCustomRouterJson } from 'Router/CustomRouterJson';
import { IUrlRewriter } from './UrlRewriter/IUrlRewriter';
import {
    getPath,
    IRouteTree,
    TRouteTreeNode,
    UrlRewriterClass,
} from './UrlRewriter/UrlRewriterClass';

type RouteEntriesArray = string[][];

/**
 * Набор методов для работы с router.json, в котором можно задать соответствие
 * между текущим путем и его короткой записью - "красивым" URL
 * @public
 * @author Мустафин Л.И.
 */
export default class UrlRewriterAPI implements IUrlRewriter {
    protected constructor(private rewriters: UrlRewriterClass[]) {}

    get(originalUrl: string): string {
        let result;
        for (const rewriter of this.rewriters) {
            result = rewriter.get(originalUrl, true);
            if (result) {
                break;
            }
        }
        return result ?? originalUrl;
    }

    getReverse(rewrittenUrl: string): string {
        let result;
        for (const rewriter of this.rewriters) {
            result = rewriter.getReverse(rewrittenUrl, true);
            if (result) {
                break;
            }
        }
        return result ?? rewrittenUrl;
    }

    /**
     * Получение инстанса класса, т.к. класс - синглтон
     * Инстанс необходимо хранить на уровне Request - т.к. на СП файлы кэшируются
     * и альтернативные router.json будут применяться там, где их быть не должно.
     */
    static getInstance(): UrlRewriterAPI {
        const store = getStore<Record<string, UrlRewriterAPI>>('UrlRewriterAPI');
        let instance = store.get('instance');
        if (!instance) {
            const rewriters = [];

            // альтернативный router.json, который придет из прикладной реализации фичи RouterJson
            const altRouterJson = getCustomRouterJson();
            if (altRouterJson) {
                rewriters.push(new UrlRewriterClass(_prepareRoutes(altRouterJson)));
            }

            // базовый router.json текущей сборки
            const routes = _prepareRoutes((routerJson as unknown as Record<string, string>) || {});
            rewriters.push(new UrlRewriterClass(routes));

            instance = new UrlRewriterAPI(rewriters);
            store.set('instance', instance);
        }
        return instance;
    }
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
            result.rootRoute = '/' + getPath(routeDest);
            return;
        }

        const routeNameParts: string[] = getPath(routeName).split('/');

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
