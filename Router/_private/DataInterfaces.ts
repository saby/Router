/**
 * Одно состояние в истории браузера.
 * @public
 * @author Мустафин Л.И.
 */
export interface IHistoryState {
    /**
     * Числовой идентификатор текущего состояния.
     */
    id?: number;
    /**
     * Действительный адрес, с которым работает роутинг.
     */
    state: string;
    /**
     * Красивый" адрес, который отображается пользователю.
     */
    href?: string;
}

/**
 * Тип функции, который вызывается при различных изменениях состояния компонентов Роутинга
 * @param {IHistoryState} newLoc Cостояние, в которое был совершен переход
 * @param {IHistoryState} oldLoc Cостояние, из которого был совершен переход
 * @see Router/router:Route
 * @see Router/router:Reference
 */
export type TStateChangeFunction = (
    newLoc: IHistoryState,
    oldLoc: IHistoryState
) => Promise<boolean> | boolean;

/**
 * @private
 */
export interface IRegisterableComponent {
    getInstanceId(): string;
}

export interface IRegisteredRoute {
    beforeUrlChangeCb: TStateChangeFunction;
    afterUrlChangeCb: TStateChangeFunction;
}

export interface IRegisteredReference {
    afterUrlChangeCb: TStateChangeFunction;
}

/**
 * @private
 */
export type TOnChangeHistoryState = (newState: { spaHistory?: string[]; href?: string }) => void;
