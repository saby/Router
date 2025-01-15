import { logger } from 'Application/Env';
import UrlRewriter from './UrlRewriter';
import RouterUrl from './Router/RouterUrl';
import { IHistoryState, TOnChangeHistoryState } from './DataInterfaces';
import { IWindowHistory } from './Router/WindowHistory';

// максимальное количество SPA переходов для хранения в истории
export const SPA_HISTORY_MAX_LENGTH = 20;

/**
 * Интерфейс класса методов для взаимодействия с историей Роутера.
 * @public
 * @author Мустафин Л.И.
 */
export interface IHistory {
    /**
     * Производит переход в истории на одно состояние (предыдущее или заданное) назад
     * @param newState новое состояние - когда происходит переход назад не на
     * предыдущее состояние, а состояние ранее предыдущего
     * @remark
     * Этот метод не влияет на window.history и адресную строку браузера,
     * только внутреннее состояние роутинга.
     * Для совершения перехода назад и изменении как состояния роутера,
     * так и состояния истории и адресной строки браузера, используйте
     * нативный метод window.history.back
     */
    back(newState?: IHistoryState): void;
    /**
     * Производит переход в истории на одно (следующее или заданное) состояние вперед
     * @param newState новое состояние - когда происходит переход не на следующее
     * состояние, а состояние через следующее вперед
     * @remark
     * Этот метод не влияет на window.history и адресную строку браузера, только внутреннее состояние роутинга.
     * Для совершения перехода вперед и изменения как состояния роутера, так и состояния истории и адресной строки браузера,
     * используйте нативный метод window.history.forward
     */
    forward(newState?: IHistoryState): void;
    /**
     * Переводит роутинг в новое состояние, записывая его в window.history
     * @param newState состояние для добавления
     * @remark
     * Вызов этого метода не провоцирует обновление компонентов роутинга
     * (таких как Route и Reference), он только производит запись состояния
     * в историю окна и историю роутинга.
     * Для перехода в новое состояние с обновлением компонентов роутинга,
     * используйте метод **{@link Router/router:IRouter#navigate navigate}**.
     * @see Router/router:IRouter#navigate
     */
    push(newState: IHistoryState): void;
    /**
     * Заменяет текущее состоянии истории на переданное
     * @param newState состояние для замены
     * Вызов этого метода не провоцирует обновление компонентов роутинга
     * (таких как Route и Reference), он только производит запись состояния
     * в историю окна и историю роутинга.
     * Для перехода в новое состояние с обновлением компонентов роутинга,
     * используйте метод **{@link Router/router:IRouter#navigate replaceState}**.
     * @see Router/router:IRouter#replaceState
     */
    replaceState(newState: IHistoryState): void;
    /**
     * Возвращает предыдущее состояние истории (если такое есть).

     */
    getPrevState(): IHistoryState;
    /**
     * Возвращает текущее состояние истории.

     */
    getCurrentState(): IHistoryState;
    /**
     * Возвращает следующее состояние истории (если такое есть).

     */
    getNextState(): IHistoryState;
    /**
     * Возвращает список состояний истории роутера.
     * @returns Список состояний истории.
     */
    getHistory(): IHistoryState[];
    /**
     * Возвращает индекс активного в данный момент состояния истории
     * @returns индекс активного состояния истории
     */
    getHistoryPosition(): number;
}

/**
 * Набор методов для взаимодействия с Историей Роутера.
 * @private
 * @author Мустафин Л.И.
 */
export default class History implements IHistory {
    /**
     * История переходов роутера
     */
    protected _routerHistory: IHistoryState[];
    /**
     * текущая позиция активной страницы из истории роутера
     */
    private _historyPosition: number;
    /**
     * История SPA переходов
     */
    protected _spaHistory: string[] = [];
    /**
     * Функция-callback, который вызываем для установки
     */
    private _onChangeHistoryState: TOnChangeHistoryState;

    constructor(
        private _urlRewriter: UrlRewriter,
        private _routerUrl: RouterUrl,
        private _windowHistory: IWindowHistory,
        onChangeState?: TOnChangeHistoryState
    ) {
        this._onChangeHistoryState = typeof onChangeState === 'function' ? onChangeState : () => {};
        this._initHistory();
    }

    /**
     * Инициализация изначального состояния истории роутера
     */
    private _initHistory(): void {
        const currentUrl: string = this._routerUrl.getUrl();
        const initialState: IHistoryState = {
            id: 0,
            state: this._urlRewriter.get(currentUrl),
            href: currentUrl,
        };

        if (typeof window !== 'undefined') {
            if (this._windowHistory.state && typeof this._windowHistory.state.id === 'number') {
                initialState.id = this._windowHistory.state.id;
            } else if (!this._windowHistory.state) {
                callFromRouter = true;
                this._windowHistory.replaceState(
                    initialState,
                    initialState.href as string,
                    initialState.href as string
                );
                callFromRouter = false;
            }
        }

        this._setHistory([initialState]);
        this._setHistoryPosition(0);
        this._callOnChangeHistoryState(initialState);
    }

    /**
     * Производит переход в истории на одно состояние (предыдущее или заданное) назад
     * @param newState новое состояние - когда происходит переход назад не на
     * предыдущее состояние, а состояние ранее предыдущего
     * @remark
     * Этот метод не влияет на window.history и адресную строку браузера,
     * только внутреннее состояние роутинга.
     * Для совершения перехода назад и изменении как состояния роутера,
     * так и состояния истории и адресной строки браузера, используйте
     * нативный метод window.history.back
     */
    back(newState?: IHistoryState): void {
        const history: IHistoryState[] = this.getHistory();
        const historyPosition: number = this.getHistoryPosition();

        if (historyPosition === 0) {
            const newHistoryState: IHistoryState = this._calculateNewHistoryState(newState);
            history.unshift({
                id: (history[0].id as number) - 1,
                state: newHistoryState.state,
                href: newHistoryState.href,
            });
        } else if (newState && newState.state) {
            // при переходе назад на несколько состояний (стрелкой в браузере)
            // необходимо пересчитать новую позицию истории роутинга
            let newPosition: number = historyPosition - 1;
            for (let i = newPosition; i >= 0; i--) {
                const historyState = history[i];
                if (historyState.state === newState.state) {
                    // newState приходит из window.history.state - его могут перебить прикладники и там может лежать
                    // чужой объект. Поэтому если нет newState.id, то не сверяем id
                    if (!('id' in newState) || historyState.id === newState.id) {
                        newPosition = i;
                        break;
                    }
                }
            }
            this._setHistoryPosition(newPosition);
        } else {
            this._setHistoryPosition(historyPosition - 1);
        }

        this._callOnChangeHistoryState(this.getCurrentState());
        this._updateStateUrl();
    }

    /**
     * Производит переход в истории на одно (следующее или заданное) состояние вперед
     * @param newState новое состояние - когда происходит переход не на следующее
     * состояние, а состояние через следующее вперед
     * @remark
     * Этот метод не влияет на window.history и адресную строку браузера, только внутреннее состояние роутинга.
     * Для совершения перехода вперед и изменения как состояния роутера, так и состояния истории и адресной строки браузера,
     * используйте нативный метод window.history.forward
     */
    forward(newState?: IHistoryState): void {
        const history: IHistoryState[] = this.getHistory();
        let newHistoryPosition: number = this.getHistoryPosition() + 1;

        // при переходе вперед на несколько состояний (стрелкой в браузере)
        // необходимо пересчитать новую позицию истории роутинга
        if (newState && newState.state && newHistoryPosition < history.length) {
            for (let i = newHistoryPosition; i < history.length; i++) {
                if (history[i].state === newState.state) {
                    newHistoryPosition = i;
                    break;
                }
            }
        }

        this._setHistoryPosition(newHistoryPosition);
        if (newHistoryPosition === history.length) {
            const newHistoryState: IHistoryState = this._calculateNewHistoryState(newState);
            history.push({
                id: (history[newHistoryPosition - 1].id as number) + 1,
                state: newHistoryState.state,
                href: newHistoryState.href,
            });
        }

        this._callOnChangeHistoryState(this.getCurrentState());
        this._updateStateUrl();
    }

    /**
     * Вычислим правильные state и href для нового состояния истории переходов
     * Либо его передали при переходе (по стрелке в браузере), либо возьмем его из window.history
     * Если в итоге не найдем, то потом оно будет вычислено из URL-адреса, которое сейчас отображается в адресной строке
     * @param newState
     */
    private _calculateNewHistoryState(newState?: IHistoryState): IHistoryState {
        if (newState && newState.state) {
            return {
                id: newState.id,
                state: this._urlRewriter.get(newState.state),
                href: newState.href || this._urlRewriter.getReverse(newState.state),
            };
        }

        // Если в window.history уже есть state, то используем его, вместо того, чтобы вычислять
        const windowHistoryState: { id: number; state: string } | undefined | null =
            window?.history?.state;
        const currentState: string | undefined | null =
            windowHistoryState && windowHistoryState.state;
        const currentHref: string = this._routerUrl.getUrl();
        return {
            id: windowHistoryState?.id || 0,
            state: currentState || this._urlRewriter.get(currentHref),
            href: currentHref,
        };
    }

    /**
     * Переводит роутинг в новое состояние, записывая его в window.history
     * @param newState состояние для добавления
     * @remark
     * Вызов этого метода не провоцирует обновление компонентов роутинга
     * (таких как Route и Reference), он только производит запись состояния
     * в историю окна и историю роутинга.
     * Для перехода в новое состояние с обновлением компонентов роутинга,
     * используйте метод **{@link Router/router:IRouter#navigate navigate}**.
     * @see Router/router:IRouter#navigate
     */
    push(newState: IHistoryState): void {
        const history: IHistoryState[] = this.getHistory();
        const historyPosition: number = this.getHistoryPosition();

        // remove all states after the current state
        history.length = historyPosition + 1;

        // add new history state to the store
        newState.id = (history[historyPosition].id as number) + 1;
        history.push(newState);
        this._setHistoryPosition(historyPosition + 1);

        this._callOnChangeHistoryState(newState);
        // update the URL
        this._updateStateUrl();
        const displayUrl: string = newState.href || newState.state;
        this._windowHistory.pushState(newState, displayUrl, displayUrl);
    }

    /**
     * Заменяет текущее состоянии истории на переданное
     * @param newState состояние для замены
     * Вызов этого метода не провоцирует обновление компонентов роутинга
     * (таких как Route и Reference), он только производит запись состояния
     * в историю окна и историю роутинга.
     * Для перехода в новое состояние с обновлением компонентов роутинга,
     * используйте метод **{@link Router/router:IRouter#navigate replaceState}**.
     * @see Router/router:IRouter#replaceState
     */
    replaceState(newState: IHistoryState): void {
        const history: IHistoryState[] = this.getHistory();
        const historyPosition: number = this.getHistoryPosition();
        const currentState: IHistoryState = history[historyPosition];

        newState.id = currentState.id;
        newState.href = newState.href || this._urlRewriter.getReverse(newState.state);

        history[historyPosition] = newState;

        this._callOnChangeHistoryState(newState, true);
        this._updateStateUrl();
        callFromRouter = true;
        this._windowHistory.replaceState(newState, newState.href, newState.href);
        callFromRouter = false;
    }

    private _updateStateUrl(): void {
        this._routerUrl.setStateUrl(this.getCurrentState().state);
    }

    /**
     * Возвращает предыдущее состояние истории (если такое есть).

     */
    getPrevState(): IHistoryState {
        return this.getHistory()[this.getHistoryPosition() - 1];
    }

    /**
     * Возвращает текущее состояние истории.

     */
    getCurrentState(): IHistoryState {
        return this.getHistory()[this.getHistoryPosition()];
    }

    /**
     * Возвращает следующее состояние истории (если такое есть).

     */
    getNextState(): IHistoryState {
        return this.getHistory()[this.getHistoryPosition() + 1];
    }

    /**
     * Возвращает список состояний истории роутера.
     * @returns Список состояний истории.
     */
    getHistory(): IHistoryState[] {
        return this._routerHistory;
    }

    /**
     * Заменяет список состояний истории роутера
     * @param value Новый список состояний истории.
     * @hidden
     */
    protected _setHistory(newRouterHistory: IHistoryState[]): void {
        this._routerHistory = newRouterHistory;
    }

    /**
     * Возвращает индекс активного в данный момент состояния истории
     * @returns индекс активного состояния истории
     */
    getHistoryPosition(): number {
        return this._historyPosition;
    }

    /**
     * Активирует состояние истории с заданным индексом
     * @param value индекс состояния, которое должно быть активировано
     * @hidden
     */
    protected _setHistoryPosition(position: number): void {
        this._historyPosition = position;
    }

    /**
     * Возвращает список с url последних 20 SPA переходов
     */
    getSpaHistory(): string[] {
        return this._spaHistory;
    }

    private _callOnChangeHistoryState(historyState: IHistoryState, replace: boolean = false): void {
        const href = historyState.href || historyState.state;

        // Обновление истории SPA переходов
        if (replace) {
            this._spaHistory.pop();
        }
        this._spaHistory.push(href);

        // в истории храним максимум 20 предыдущих переходов. остальные удаляем
        while (this._spaHistory.length > SPA_HISTORY_MAX_LENGTH) {
            this._spaHistory.shift();
        }

        this._onChangeHistoryState({ href, spaHistory: this._spaHistory });
    }
}

declare global {
    // eslint-disable-next-line
    var unsafe_replaceState: boolean;
}

// признак того, что метод replaceState вызвали из роутера
let callFromRouter = true;

if (typeof window !== 'undefined') {
    const origReplaceState = window.history.replaceState;
    window.history.replaceState = function (
        data: any,
        unused: string,
        url?: string | URL | null | undefined
    ) {
        if (!callFromRouter && !globalThis.unsafe_replaceState) {
            logger.error(
                new Error(
                    'Нельзя вызывать window.history.replaceState в обход механизмов Wasaby-роутинга. \n' +
                        'Используйте методы Router/router:IRouter#replaceState или Router/router:IHistory#replaceState.'
                )
            );
        }
        origReplaceState.apply(window.history, [data, unused, url]);
    };
}
