import RouterUrl from 'Router/_private/Router/RouterUrl';
import MaskResolver from 'Router/_private/MaskResolver';
import Router from 'Router/_private/Router/Router';
import UrlRewriterTest from 'RouterTest/UrlRewriter/UrlRewriterTest';
import HistoryTest from 'RouterTest/History/HistoryTest';
import RouterManagerTest from 'RouterTest/RouterManager/RouterManagerTest';

export class RouterTest extends Router {
    readonly urlRewriter: UrlRewriterTest;
    readonly history: HistoryTest;
    readonly _manager: RouterManagerTest;
}

/**
 * Функция создания объекта Router для unit тестов
 */
export function createRouter(): RouterTest {
    const urlRewriter = UrlRewriterTest.getInstance();
    const routerUrl = new RouterUrl(window.location, urlRewriter);
    const maskResolver = new MaskResolver(urlRewriter, routerUrl);
    const routerHistory = new HistoryTest(urlRewriter, routerUrl, window.history, () => {});
    const routerManager = new RouterManagerTest();
    return new RouterTest(urlRewriter, routerUrl, maskResolver, routerHistory, routerManager);
}
