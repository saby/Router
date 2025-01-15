import UrlRewriter from '../UrlRewriter';
import { IRouter } from './Router';
import { IHistoryState } from '../DataInterfaces';

/**
 * Подписка на событие "onpopstate" для отслеживания нажатия по стрелка перехода по истории браузера
 */
export default function initOnPopState(routerGetter: () => IRouter): void {
    if (typeof window === 'undefined') {
        return;
    }

    /**
     * при невозможности перейти к следующему состоянию, блокируем обработку события "popstate",
     * пока не выполнится errback метода IRouter.navigate
     */
    let skipNextChange: boolean = false;

    window.onpopstate = (event: PopStateEvent) => {
        if (skipNextChange) {
            skipNextChange = false;
            return;
        }

        // тут проверяем, что если в истории браузера записан какой-то объект состояния и в нем нет полей
        // роутера (id, state, href), то не вызываем navigate. Т.к. считаем, что кто-то записал состояние
        // в обход роутера и не хочет, чтобы совершали переход роутером
        if (event.state && !event.state.id && !event.state.state && !event.state.href) {
            return;
        }

        const router = routerGetter();

        const currentState: IHistoryState = router.history.getCurrentState();
        const prevState: IHistoryState = router.history.getPrevState();

        // нажатие на стрелку "назад" браузера
        if (
            (!event.state && !prevState) ||
            (event.state && event.state.id < (currentState.id as number))
        ) {
            const navigateToState: IHistoryState = _getNavigationState(
                prevState,
                event.state,
                event.state || prevState ? router.url.getStateUrl() : router.url.getUrl()
            );
            router.navigate(navigateToState, () => {
                return router.history.back(navigateToState);
            });
        } else {
            // нажатие на стрелку "вперед" браузера
            const nextState: IHistoryState = router.history.getNextState();
            const navigateToState: IHistoryState = _getNavigationState(
                nextState,
                event.state,
                router.url.getStateUrl()
            );
            router.navigate(
                navigateToState,
                () => {
                    return router.history.forward(navigateToState);
                },
                () => {
                    // unable to navigate to specified state, going back in history
                    skipNextChange = true;
                    window.history.back();
                }
            );
        }
    };
}

function _getNavigationState(
    localState: IHistoryState,
    windowState: IHistoryState,
    currentUrl: string
): IHistoryState {
    if (!localState) {
        if (windowState && windowState.state && windowState.href) {
            return windowState;
        }
        return {
            state: UrlRewriter.getInstance().get(currentUrl),
            href: currentUrl,
        };
    }
    if (windowState && windowState.state && windowState.href) {
        return windowState;
    }
    return localState;
}
