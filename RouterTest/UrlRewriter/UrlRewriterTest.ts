import UrlRewriter, { _prepareRoutes } from 'Router/_private/UrlRewriter';

/**
 * Класс, необходимый для unit тестов для переопределения router.json с которым работает его родитель UrlRewriter
 */
export default class UrlRewriterTest extends UrlRewriter {
    static _createNewInstance(json: {}): void {
        UrlRewriter.instance = new UrlRewriter(_prepareRoutes(json));
    }
}
