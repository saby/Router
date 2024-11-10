import { getStore, location as envLocation, logger, ILocation } from 'Application/Env';
import UrlRewriter from '../UrlRewriter';
import RouterUrl from './RouterUrl';
import MaskResolver, { getAppNameByUrl } from '../MaskResolver';
import History from '../History';
import RouterManager from './RouterManager';
import WindowLocation, { IWindowLocation } from './WindowLocation';
import WindowHistory, { IWindowHistory } from './WindowHistory';
import { IHistoryState, TOnChangeHistoryState } from '../DataInterfaces';

/**
 * Интерфейс класса реализующего API работы с роутингом.
 * Более подробно API роутинга описано по {@link /doc/platform/developmentapl/interface-development/routing/#router-api ссылке}
 * @public
 * @author Мустафин Л.И.
 */
export interface IRouter {
    /**
     * Набор методов для работы с router.json, в котором можно задать соответствие
     * между текущим путем и его короткой записью - "красивым" URL
     */
    readonly urlRewriter: UrlRewriter;
    /**
     * Класс для работы с url в рамках Роутинга.
     */
    readonly url: RouterUrl;
    /**
     * Набор методов обеспечивающих работу с масками и параметрами URL
     */
    readonly maskResolver: MaskResolver;
    /**
     * Набор методов для взаимодействия с Историей Роутера
     */
    readonly history: History;
    /**
     * Менеджер обработчиков (до и после SPA перехода) для контролов Route и Reference.
     * @hidden
     */
    readonly _manager: RouterManager;
    /**
     * Производит single-page переход (без перезагрузки страницы) к новому состоянию (URL-адресу).
     * @param newState Состояние для перехода.
     * @param callback Необязательная функция, будет вызвана вместо window.history.pushState.
     * @param errback Необязательная функция, будет вызвана если один из компонентов Route отменит переход.
     *
     * @example
     * <pre>
     * import { IHistoryState } from 'Router/router';
     * // ...
     * _afterMount(): void {
     *     const state: IHistoryState = {state: 'some/new/state', href: 'pretty_url'}
     *     this._options.Router.navigate(state, () => true, (err) => alert(err.message));
     * }
     * // ...
     * </pre>
     *
     */
    navigate: (
        newState: IHistoryState,
        callback?: () => void | boolean,
        errback?: (err?: Error) => void
    ) => void;
    /**
     * Производит переход без перезагрузки страницы без добавления новой записи в историю переходов (вместо этого заменяет текущую).
     * @param newHistoryState Состояние для перехода.
     * @param callback Функция, которая будет вызвана после изменения URL адреса в адресной строке
     * @see Router/router:IRouter#navigate
     *
     * @example
     * <pre>
     * import { IHistoryState } from 'Router/router';
     * // ...
     * _afterMount(): void {
     *     const state: IHistoryState = {state: 'some/new/state'};
     *     this._options.Router.replaceState(state, (newState) => alert('Переход совершён!'));
     * }
     * // ...
     * </pre>
     */
    replaceState: (
        newHistoryState: IHistoryState,
        callback?: (rewrittenHistoryState: IHistoryState) => void
    ) => void;
}

/**
 * Класс реализующий API работы с роутингом
 * @private
 */
export default class Router implements IRouter {
    /**
     * Признак того, что уже идет процесс SPA перехода
     */
    private _isNavigating: boolean = false;
    protected _instId: number;

    constructor(
        readonly urlRewriter: UrlRewriter,
        readonly url: RouterUrl,
        readonly maskResolver: MaskResolver,
        readonly history: History,
        readonly _manager: RouterManager
    ) {
        this._instId = Router._instIdCounter++;
    }

    /**
     * Производит single-page переход (без перезагрузки страницы) к новому состоянию (URL-адресу).
     * @param newState Состояние для перехода.
     * @param callback Необязательная функция, будет вызвана вместо window.history.pushState.
     * @param errback Необязательная функция, будет вызвана если один из компонентов Route отменит переход.
     *
     * @example
     * <pre>
     * import { IHistoryState } from 'Router/router';
     * // ...
     * _afterMount(): void {
     *     const state: IHistoryState = {state: 'some/new/state', href: 'pretty_url'}
     *     this._options.Router.navigate(state, () => true, (err) => alert(err.message));
     * }
     * // ...
     * </pre>
     *
     */
    navigate(
        newState: IHistoryState,
        callback?: () => void | boolean,
        errback?: (err?: Error) => void
    ): void {
        const rewrittenNewUrl: string = this.urlRewriter.get(newState.state);
        const prettyUrl: string = newState.href || this.urlRewriter.getReverse(rewrittenNewUrl);
        const currentState: IHistoryState = this.history.getCurrentState();

        if (currentState.state === rewrittenNewUrl || this._isNavigating) {
            return;
        }
        const rewrittenNewState: IHistoryState = {
            state: rewrittenNewUrl,
            href: prettyUrl,
        };
        this._isNavigating = true;

        const tryApplyNewStateCallback = (accept: boolean) => {
            this._isNavigating = false;
            if (accept) {
                if (callback) {
                    if (callback() === true) {
                        this.history.push(rewrittenNewState);
                    }
                } else {
                    this.history.push(rewrittenNewState);
                }
                this._manager.callAfterUrlChange(rewrittenNewState, currentState);
            } else if (errback) {
                errback();
            }
        };
        const tryApplyNewStateErrback = (err: Error) => {
            this._isNavigating = false;
            if (errback) {
                errback(err);
            } else {
                logger.error('Ошибка при вызове IRouter.navigate - ' + err.message, err);
            }
        };

        let result: Promise<boolean> | boolean;
        try {
            result = this._tryApplyNewState(rewrittenNewState);
        } catch (err) {
            tryApplyNewStateErrback(err as Error);
            return;
        }

        if (result instanceof Promise) {
            result.then(tryApplyNewStateCallback, tryApplyNewStateErrback);
            return;
        }
        tryApplyNewStateCallback(result);
    }

    /**
     * Производит переход без перезагрузки страницы без добавления новой записи в историю переходов (вместо этого заменяет текущую).
     * @param newHistoryState Состояние для перехода.
     * @param callback Функция, которая будет вызвана после изменения URL адреса в адресной строке
     * @see Router/router:IRouter#navigate
     *
     * @example
     * <pre>
     * import { IHistoryState } from 'Router/router';
     * // ...
     * _afterMount(): void {
     *     const state: IHistoryState = {state: 'some/new/state'};
     *     this._options.Router.replaceState(state, (newState) => alert('Переход совершён!'));
     * }
     * // ...
     * </pre>
     */
    replaceState(
        newHistoryState: IHistoryState,
        callback?: (rewrittenHistoryState: IHistoryState) => void
    ): void {
        const rewrittenState: string = this.urlRewriter.get(newHistoryState.state);
        const rewrittenHref: string =
            newHistoryState.href || this.urlRewriter.getReverse(rewrittenState);
        const rewrittenHistoryState: IHistoryState = {
            state: rewrittenState,
            href: rewrittenHref,
        };

        this.navigate(rewrittenHistoryState, () => {
            this.history.replaceState(rewrittenHistoryState);
            callback?.(rewrittenHistoryState);
        });
    }

    private _tryApplyNewState(newState: IHistoryState): Promise<boolean> | boolean {
        const currentState: IHistoryState = this.history.getCurrentState();
        const newApp: string = getAppNameByUrl(newState.state);
        const currentApp: string = getAppNameByUrl(currentState.state);

        const callback = (res: boolean): boolean => {
            if (newApp === currentApp) {
                return res;
            }
            // Переходим без СПА, потому что сломалась синхронизация HEAD
            // при несовпадении VirtualDom inferno разрушает HEAD. Нужно
            // допатчить инферно так, чтобы под капотом библиотека НИКОГДА
            // не удаляла HEAD и HTML
            this.url.location.href = newState.href as string;
            return false;
        };

        const result: Promise<boolean> | boolean = this._manager.callBeforeUrlChange(
            newState,
            currentState
        );
        if (result instanceof Promise) {
            return result.then((res) => {
                return callback(res);
            });
        }
        return callback(result);
    }

    private static _instIdCounter: number = 0;
}

/**
 * Получить "корневой" объект Router,
 * который иницализирует все методы API роутера относительно window.location и window.history
 * @public
 */
export function getRootRouter(
    logCall: boolean = false,
    onChangeHistoryState?: TOnChangeHistoryState
): IRouter {
    if (logCall) {
        const error = new Error(
            'Вызов getRootRouter там, где это не нужно. \
            Необходимо перейти на использование API роутера из контекста.'
        );
        logger.warn(error);
    }
    const store = getStore<Record<string, IRouter>>('ROOT_ROUTER');
    let rootRouter = store.get('instance');
    if (!rootRouter) {
        rootRouter = _createRouter(
            envLocation,
            typeof window !== 'undefined'
                ? window.history
                : new WindowHistory(new WindowLocation()),
            onChangeHistoryState
        );
        store.set('instance', rootRouter);
    }
    return rootRouter;
}

/**
 * Создание нового объекта Router, который иницализирует все методы API роутера относительно нового "контекста"
 * Этот новый Router всегда будет работать с фейковым window.location и window.history
 * @param initialUri
 * @private
 */
export function createNewRouter(
    initialUri: string = '/',
    onChangeHistoryState?: TOnChangeHistoryState
): IRouter {
    const fakeLocation: IWindowLocation = new WindowLocation(initialUri);
    const fakeHistory: IWindowHistory = new WindowHistory(fakeLocation);
    return _createRouter(fakeLocation, fakeHistory, onChangeHistoryState);
}

function _createRouter(
    _location: ILocation,
    _history: IWindowHistory,
    onChangeHistoryState?: TOnChangeHistoryState
): IRouter {
    const urlRewriter = UrlRewriter.getInstance();
    const routerUrl = new RouterUrl(_location, urlRewriter);
    const maskResolver = new MaskResolver(urlRewriter, routerUrl);
    const routerHistory = new History(urlRewriter, routerUrl, _history, onChangeHistoryState);
    const routerManager = new RouterManager();
    return new Router(urlRewriter, routerUrl, maskResolver, routerHistory, routerManager);
}
