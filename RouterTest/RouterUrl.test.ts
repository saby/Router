import { App } from 'Application/Env';
import WindowLocation from 'Router/_private/Router/WindowLocation';
import UrlRewriter from 'Router/_private/UrlRewriter';
import RouterUrl from 'Router/_private/Router/RouterUrl';

describe('Router/_private/RouterUrl', () => {
    let routerUrl: RouterUrl;

    beforeEach(() => {
        const _location = new WindowLocation('/path');
        _location.search = '?query=value';
        routerUrl = new RouterUrl(_location, UrlRewriter.getInstance());
    });

    test('getUrl', () => {
        expect(routerUrl.getUrl()).toBe('/path?query=value');
    });

    test('getStateUrl: _stateUrl не задан', () => {
        expect(routerUrl.getStateUrl()).toBe('/path?query=value');
    });

    test('getStateUrl: _stateUrl задан', () => {
        const newStateUrl = '/new/state/url';
        routerUrl.setStateUrl(newStateUrl);
        expect(routerUrl.getStateUrl()).toBe(newStateUrl);
    });

    describe('getServiceUrl', () => {
        let configState: Record<string, any>;

        beforeEach(() => {
            configState = App.getRequest().getConfig().getState();
        });

        afterEach(() => {
            App.getRequest().getConfig().setState(configState);
        });

        test('empty appRoot', () => {
            App.getRequest().getConfig().setState({ appRoot: undefined });
            expect(routerUrl.getServiceUrl('/page/main')).toBe('/page/main');
            expect(routerUrl.getServiceUrl('page/main')).toBe('page/main');
        });

        test('appRoot = "/"', () => {
            App.getRequest().getConfig().setState({ appRoot: '/' });
            expect(routerUrl.getServiceUrl('/page/main')).toBe('/page/main');
            expect(routerUrl.getServiceUrl('page/main')).toBe('page/main');
        });

        test('appRoot = "/service/"', () => {
            App.getRequest().getConfig().setState({ appRoot: '/service/' });
            expect(routerUrl.getServiceUrl('/page/main')).toBe('/service/page/main');
            expect(routerUrl.getServiceUrl('page/main')).toBe('/service/page/main');
        });

        test('appRoot = "/service/", url = "/service/page"', () => {
            App.getRequest().getConfig().setState({ appRoot: '/service/' });
            expect(routerUrl.getServiceUrl('/service/page/main')).toBe('/service/page/main');
            expect(routerUrl.getServiceUrl('service/page/main')).toBe('/service/page/main');
        });
    });
});
