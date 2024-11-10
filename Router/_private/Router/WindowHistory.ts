import { IWindowLocation } from './WindowLocation';
import { IHistoryState } from '../DataInterfaces';

export interface IWindowHistory {
    /**
     * Признак того, что объект истории создан как заглушка. При открытии приложения в приложении
     */
    isFake?: boolean;
    state: IHistoryState;
    pushState(state: IHistoryState, title: string, url: string): void;
    replaceState(state: IHistoryState, title: string, url: string): void;
    back(): void;
}

/**
 * Класс-заглушка для window.history внутри роутера при работе роутера в приложении на панели
 * @private
 */
export default class WindowHistory implements IWindowHistory {
    isFake: boolean = true;
    private _states: IHistoryState[] = [];
    get state(): IHistoryState {
        return this._states[this._states.length - 1];
    }

    constructor(private _location: IWindowLocation) {}

    pushState(state: IHistoryState, _: string, url: string): void {
        this._states.push(state);
        // необходимо актуализировать location новым url. В window.history этим занимался бы браузер
        this._location._update(url);
    }

    replaceState(state: IHistoryState, _: string, url: string): void {
        this._states.pop();
        this._states.push(state);
        // необходимо актуализировать location новым url. В window.history этим занимался бы браузер
        this._location._update(url);
    }

    back(): void {
        this._states.pop();
        const state = this._states[this._states.length - 1];
        if (state) {
            // необходимо актуализировать location новым url. В window.history этим занимался бы браузер
            this._location._update(state.href || state.state);
        }
    }
}
