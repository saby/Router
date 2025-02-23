import {
    TStateChangeFunction,
    IHistoryState,
    IRegisteredRoute,
    IRegisteredReference,
    IRegisterableComponent,
} from '../DataInterfaces';

/**
 * Интерфейс менеджера обработчиков (до и после SPA перехода) для контролов Route и Reference.
 * @public
 * @author Мустафин Л.И.
 */
export interface IRouterManager {
    /**
     * Добавление обработчиков до и после SPA перехода для контрола Route.
     * @hidden
     */
    addRoute(
        route: IRegisterableComponent,
        beforeUrlChangeCb: TStateChangeFunction,
        afterUrlChangeCb: TStateChangeFunction
    ): void;
    /**
     * Удаление обработчиков до и после SPA перехода для контрола Route.
     */
    removeRoute(route: IRegisterableComponent): void;
    /**
     * Добавление обработчика после SPA перехода для контрола Reference.
     */
    addReference(
        reference: IRegisterableComponent,
        afterUrlChangeCb: TStateChangeFunction
    ): void;
    /**
     * Добавление обработчика после SPA перехода для контрола Reference.
     */
    removeReference(reference: IRegisterableComponent): void;
    /**
     * Вызов обработчиков до SPA перехода для контролов Route.
     */
    callBeforeUrlChange(
        newState: IHistoryState,
        currentState: IHistoryState
    ): Promise<boolean> | boolean;
    /**
     * Вызов обработчиков после SPA перехода для контролов Route и Reference.
     */
    callAfterUrlChange(newState: IHistoryState, oldState: IHistoryState): void;
}

/**
 * Менеджер обработчиков (до и после SPA перехода) для контролов Route и Reference.
 * @private
 */
export default class RouterManager implements IRouterManager {
    protected _registeredRoutes: Record<string, IRegisteredRoute> = {};
    protected _registeredReferences: Record<string, IRegisteredReference> = {};

    addRoute(
        route: IRegisterableComponent,
        beforeUrlChangeCb: TStateChangeFunction,
        afterUrlChangeCb: TStateChangeFunction
    ): void {
        this._registeredRoutes[route.getInstanceId()] = {
            beforeUrlChangeCb,
            afterUrlChangeCb,
        };
    }

    removeRoute(route: IRegisterableComponent): void {
        delete this._registeredRoutes[route.getInstanceId()];
    }

    addReference(
        reference: IRegisterableComponent,
        afterUrlChangeCb: TStateChangeFunction
    ): void {
        this._registeredReferences[reference.getInstanceId()] = {
            afterUrlChangeCb,
        };
    }

    removeReference(reference: IRegisterableComponent): void {
        delete this._registeredReferences[reference.getInstanceId()];
    }

    callBeforeUrlChange(
        newState: IHistoryState,
        currentState: IHistoryState
    ): Promise<boolean> | boolean {
        // Если нет обработчиков для route'ов, то не меняем текущий url
        if (!Object.keys(this._registeredRoutes).length) {
            return false;
        }

        // вызовы АСИНХРОННЫХ предобработчиков смены url-адреса
        let callbackPromises: Promise<boolean>[] = [];
        // вызовы СИНХРОННЫХ предобработчиков смены url-адреса
        const callbackResults: boolean[] = [];

        for (const routeId in this._registeredRoutes) {
            if (!this._registeredRoutes.hasOwnProperty(routeId)) {
                continue;
            }
            const route: IRegisteredRoute = this._registeredRoutes[routeId];
            const beforeCb: Promise<boolean> | boolean =
                route.beforeUrlChangeCb(newState, currentState);
            if (beforeCb instanceof Promise) {
                callbackPromises.push(beforeCb);
            } else {
                callbackResults.push(beforeCb);
            }
        }

        // АСИНХРОННЫЙ результат выполнения предобработчиков смены url-адреса
        if (callbackPromises.length) {
            callbackPromises = callbackPromises.concat(
                callbackResults.map((r) => {
                    return Promise.resolve(r);
                })
            );
            return Promise.all(callbackPromises).then((results) => {
                return results.indexOf(false) === -1;
            });
        }

        // СИНХРОННЫЙ результат выполнения предобработчиков смены url-адреса
        return callbackResults.indexOf(false) === -1;
    }

    callAfterUrlChange(newState: IHistoryState, oldState: IHistoryState): void {
        for (const routeId in this._registeredRoutes) {
            if (this._registeredRoutes.hasOwnProperty(routeId)) {
                this._registeredRoutes[routeId].afterUrlChangeCb(
                    newState,
                    oldState
                );
            }
        }

        for (const referenceId in this._registeredReferences) {
            if (this._registeredReferences.hasOwnProperty(referenceId)) {
                this._registeredReferences[referenceId].afterUrlChangeCb(
                    newState,
                    oldState
                );
            }
        }
    }
}
