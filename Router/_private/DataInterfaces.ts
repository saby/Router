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
 * @param newLocation Cостояние, в которое был совершен переход
 * @param oldLocation Cостояние, из которого был совершен переход
 */
export type TStateChangeFunction = (
    newLoc: IHistoryState,
    oldLoc: IHistoryState
) => Promise<boolean> | boolean;

/**
 *
 */
export interface IRegisterableComponent {
    /**
     *
     */
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
 *
 */
export type TOnChangeHistoryState = (newState: {
    spaHistory?: string[];
    href?: string;
}) => void;
