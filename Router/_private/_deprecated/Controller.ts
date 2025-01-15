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
import {
    IHistoryState,
    IRegisterableComponent,
    TStateChangeFunction,
} from '../DataInterfaces';

/**
 * Производит single-page переход (без перезагрузки страницы) к новому состоянию (URL-адресу).
 * @param newState Состояние для перехода.
 * @param callback Необязательная функция, будет вызвана вместо window.history.pushState.
 * @param errback Необязательная функция, будет вызвана если один из компонентов Route отменит переход.
 *
 * @example
 * <pre>
 * import { Controller } from 'Router/router';
 * const state: IHistoryState = {state: 'some/new/state', href: 'pretty_url'}
 * Controller.navigate(state, () => window.history.pushState(state, state.href), (err) => alert(err.message));
 * </pre>
 * @deprecated
 * Используйте методы объекта Router из контекста {@link https://wi.sbis.ru/docs/js/UICore/Contexts/methods/WasabyContextManager/ WasabyContextManager}.
 * Подробнее в статье "{@link https://wi.sbis.ru/doc/platform/developmentapl/interface-development/routing/#router-api Доступ к методам API роутинга}".
 */
export function navigate(
    newState: IHistoryState,
    callback?: () => void | boolean,
    errback?: (err?: Error) => void
): void {
    getRootRouter().navigate(newState, callback, errback);
}

/**
 * Производит переход без перезагрузки страницы без добавления новой записи в историю переходов (вместо этого заменяет текущую).
 * @param newHistoryState Состояние для перехода.
 * @param callback Функция, которая будет вызвана после изменения URL адреса в адресной строке
 * @see Router/_private/Controller#navigate
 *
 * @example
 * <pre>
 * import { Controller } from 'Router/router';
 * const state: IHistoryState = {state: 'some/new/state'}
 * Controller.replaceState(state, (newState) => alert('Переход совершён!'));
 * </pre>
 * @deprecated
 * Используйте методы объекта Router из контекста {@link https://wi.sbis.ru/docs/js/UICore/Contexts/methods/WasabyContextManager/ WasabyContextManager}.
 * Подробнее в статье "{@link https://wi.sbis.ru/doc/platform/developmentapl/interface-development/routing/#router-api Доступ к методам API роутинга}".
 */
export function replaceState(
    newHistoryState: IHistoryState,
    callback?: (rewrittenHistoryState: IHistoryState) => void
): void {
    getRootRouter().replaceState(newHistoryState, callback);
}

/**
 * @hidden
 * @deprecated
 * Используйте методы объекта Router из контекста {@link https://wi.sbis.ru/docs/js/UICore/Contexts/methods/WasabyContextManager/ WasabyContextManager}.
 * Подробнее в статье "{@link https://wi.sbis.ru/doc/platform/developmentapl/interface-development/routing/#router-api Доступ к методам API роутинга}".
 */
export function addRoute(
    route: IRegisterableComponent,
    beforeUrlChangeCb: TStateChangeFunction,
    afterUrlChangeCb: TStateChangeFunction
): void {
    getRootRouter()._manager.addRoute(
        route,
        beforeUrlChangeCb,
        afterUrlChangeCb
    );
}

/**
 * @hidden
 * @deprecated
 * Используйте методы объекта Router из контекста {@link https://wi.sbis.ru/docs/js/UICore/Contexts/methods/WasabyContextManager/ WasabyContextManager}.
 * Подробнее в статье "{@link https://wi.sbis.ru/doc/platform/developmentapl/interface-development/routing/#router-api Доступ к методам API роутинга}".
 */
export function removeRoute(route: IRegisterableComponent): void {
    getRootRouter()._manager.removeRoute(route);
}
