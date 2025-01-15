/**
 * Набор методов для взаимодействия с Историей Роутера
 * @module
 * @author Мустафин Л.И.
 * @private
 * @deprecated
 * Используйте методы объекта Router из контекста {@link https://wi.sbis.ru/docs/js/UICore/Contexts/methods/WasabyContextManager/ WasabyContextManager}.
 * Подробнее в статье "{@link https://wi.sbis.ru/doc/platform/developmentapl/interface-development/routing/#router-api Доступ к методам API роутинга}".
 */

import { getRootRouter } from '../Router/Router';
import { IHistoryState } from '../DataInterfaces';

/**
 * Возвращает предыдущее состояние истории (если такое есть).
 * @returns
 * @deprecated
 * Используйте методы объекта Router из контекста {@link https://wi.sbis.ru/docs/js/UICore/Contexts/methods/WasabyContextManager/ WasabyContextManager}.
 * Подробнее в статье "{@link https://wi.sbis.ru/doc/platform/developmentapl/interface-development/routing/#router-api Доступ к методам API роутинга}".
 */
export function getPrevState(): IHistoryState {
    return getRootRouter().history.getPrevState();
}

/**
 * Возвращает текущее состояние истории.
 * @returns
 * @deprecated
 * Используйте методы объекта Router из контекста {@link https://wi.sbis.ru/docs/js/UICore/Contexts/methods/WasabyContextManager/ WasabyContextManager}.
 * Подробнее в статье "{@link https://wi.sbis.ru/doc/platform/developmentapl/interface-development/routing/#router-api Доступ к методам API роутинга}".
 */
export function getCurrentState(): IHistoryState {
    return getRootRouter().history.getCurrentState();
}

/**
 * Возвращает следующее состояние истории (если такое есть).
 * @returns
 * @deprecated
 * Используйте методы объекта Router из контекста {@link https://wi.sbis.ru/docs/js/UICore/Contexts/methods/WasabyContextManager/ WasabyContextManager}.
 * Подробнее в статье "{@link https://wi.sbis.ru/doc/platform/developmentapl/interface-development/routing/#router-api Доступ к методам API роутинга}".
 */
export function getNextState(): IHistoryState {
    return getRootRouter().history.getNextState();
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
 * @deprecated
 * Используйте методы объекта Router из контекста {@link https://wi.sbis.ru/docs/js/UICore/Contexts/methods/WasabyContextManager/ WasabyContextManager}.
 * Подробнее в статье "{@link https://wi.sbis.ru/doc/platform/developmentapl/interface-development/routing/#router-api Доступ к методам API роутинга}".
 */
export function back(newState?: IHistoryState): void {
    getRootRouter().history.back(newState);
}

/**
 * Производит переход в истории на одно (следующее или заданное) состояние вперед
 * @param newState новое состояние - когда происходит переход не на следующее
 * состояние, а состояние через следующее вперед
 * @remark
 * Этот метод не влияет на window.history и адресную строку браузера, только внутреннее состояние роутинга.
 * Для совершения перехода вперед и изменения как состояния роутера, так и состояния истории и адресной строки браузера,
 * используйте нативный метод window.history.forward
 * @deprecated
 * Используйте методы объекта Router из контекста {@link https://wi.sbis.ru/docs/js/UICore/Contexts/methods/WasabyContextManager/ WasabyContextManager}.
 * Подробнее в статье "{@link https://wi.sbis.ru/doc/platform/developmentapl/interface-development/routing/#router-api Доступ к методам API роутинга}".
 */
export function forward(newState?: IHistoryState): void {
    getRootRouter().history.forward(newState);
}

/**
 * Переводит роутинг в новое состояние, записывая его в window.history
 * @param newState состояние для добавления
 * @remark
 * Вызов этого метода не провоцирует обновление компонентов роутинга
 * (таких как Route и Reference), он только производит запись состояния
 * в историю окна и историю роутинга.
 * Для перехода в новое состояние с обновлением компонентов роутинга,
 * используйте метод **navigate** Controller'а.
 * @see Router/_private/Controller#navigate
 * @deprecated
 * Используйте методы объекта Router из контекста {@link https://wi.sbis.ru/docs/js/UICore/Contexts/methods/WasabyContextManager/ WasabyContextManager}.
 * Подробнее в статье "{@link https://wi.sbis.ru/doc/platform/developmentapl/interface-development/routing/#router-api Доступ к методам API роутинга}".
 */
export function push(newState: IHistoryState): void {
    getRootRouter().history.push(newState);
}

/**
 * Заменяет текущее состоянии истории на переданное
 * @param newState состояние для замены
 * Вызов этого метода не провоцирует обновление компонентов роутинга
 * (таких как Route и Reference), он только производит запись состояния
 * в историю окна и историю роутинга.
 * Для перехода в новое состояние с обновлением компонентов роутинга,
 * используйте метод **replaceState** Controller'а.
 * @see Router/_private/Controller#replaceState
 * @deprecated
 * Используйте методы объекта Router из контекста {@link https://wi.sbis.ru/docs/js/UICore/Contexts/methods/WasabyContextManager/ WasabyContextManager}.
 * Подробнее в статье "{@link https://wi.sbis.ru/doc/platform/developmentapl/interface-development/routing/#router-api Доступ к методам API роутинга}".
 */
export function replaceState(newState: IHistoryState): void {
    getRootRouter().history.replaceState(newState);
}
