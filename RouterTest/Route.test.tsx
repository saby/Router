/**
 * @jest-environment jsdom
 */
import { unmountComponentAtNode, render } from 'react-dom';
import { act } from 'react-dom/test-utils';
import { constants } from 'Env/Env';
import { WasabyContextManager } from 'UI/Contexts';
import { Route, ContextProvider } from 'Router/router';
import * as RouterBase from 'Router/_private/Router/Router';
import RouterManager from 'Router/_private/Router/RouterManager';
// @ts-ignore
import * as defaultRouterJson from 'router';
import UrlRewriterTest from './UrlRewriter/UrlRewriterTest';
import { createRouter } from './resources/CreateRouter';
import * as fakeAppManager from './resources/fakeAppManager';
import { Route as BaseRoute } from 'Router/_private/Route';

describe('Router/Route', () => {
    let container: HTMLElement;
    let compat: boolean;
    const Router = createRouter();

    beforeAll(() => {
        // define a fake ctestapp/Index component so tests
        // do not do redirects
        fakeAppManager.createFakeApp('TestModule');

        compat = constants.compat;
        constants.compat = false;

        UrlRewriterTest._createNewInstance({
            '/ctestapp': 'TestModule/ctestapp',
            '/': 'TestModule',
            '/my': 'TestModule/my',
        });
    });

    afterAll(() => {
        constants.compat = compat;

        UrlRewriterTest._createNewInstance(
            (defaultRouterJson as unknown as Record<string, string>) || {}
        );
    });

    beforeEach(() => {
        Router.url.setStateUrl('/ctestapp');
        Router.history.setHistory([
            {
                id: 0,
                state: '/ctestapp',
                href: '/ctestapp',
            },
        ]);
        Router.history.setHistoryPosition(0);
        /*
        _afterMount и _afterUpdate зовутся в отдельной таске, чтобы браузер мог отрисовать кадр.
        Чтобы не делать тесты асинхронными, мы просто мокнем таймеры и сами будем управлять временем.
         */
        jest.useFakeTimers();
        container = document.createElement('div');
        document.body.appendChild(container);
        jest.spyOn(window, 'requestAnimationFrame').mockImplementation(setTimeout);
    });

    afterEach(() => {
        jest.useRealTimers();
        unmountComponentAtNode(container);
        container.remove();
        jest.restoreAllMocks();
    });

    test('registers when created', () => {
        const addRouteSpy = jest.spyOn(RouterManager.prototype, 'addRoute').mockName('addRoute');
        act(() => {
            render(
                <ContextProvider Router={Router}>
                    <Route mask="name/:value" />
                </ContextProvider>,
                container
            );
        });

        expect(addRouteSpy).toHaveBeenCalledTimes(1);
        expect(addRouteSpy.mock.calls[0][0]).toBeInstanceOf(BaseRoute);
    });

    test('unregisters when destroyed', () => {
        const removeRouteSpy = jest
            .spyOn(RouterManager.prototype, 'removeRoute')
            .mockName('removeRoute');
        act(() => {
            render(
                <ContextProvider Router={Router}>
                    <Route mask="name/:value" />
                </ContextProvider>,
                container
            );
        });

        // unmount контрола и вызов _beforeUnmount
        act(() => {
            unmountComponentAtNode(container);
        });

        expect(removeRouteSpy).toHaveBeenCalledTimes(1);
        expect(removeRouteSpy.mock.calls[0][0]).toBeInstanceOf(BaseRoute);
    });

    test('fires on:enter & on:beforeChange when starts matching url', () => {
        const currentState = { state: '/ctestapp' };
        const newState = { state: '/ctestapp/test/result' };
        const onBeforeChange = jest.fn();
        const onEnter = jest.fn();
        act(() => {
            render(
                <ContextProvider Router={Router}>
                    <Route mask="test/:value" onBeforeChange={onBeforeChange} onEnter={onEnter} />
                </ContextProvider>,
                container
            );
        });

        act(() => {
            Router.navigate(newState);
        });

        expect(onBeforeChange).toHaveBeenCalled();
        // on:beforeChange
        expect(onBeforeChange.mock.calls[0][0]).toEqual(expect.objectContaining(newState));
        expect(onBeforeChange.mock.calls[0][1]).toEqual(expect.objectContaining(currentState));

        expect(onEnter).toHaveBeenCalled();
        // on:enter
        expect(onEnter.mock.calls[0][0]).toEqual(expect.objectContaining(newState));
        expect(onEnter.mock.calls[0][1]).toEqual(expect.objectContaining(currentState));
    });

    test('fires on:enter if it is created when url matches the mask', () => {
        Router.url.setStateUrl('/unique/555-abc-def');

        const onEnter = jest.fn();
        act(() => {
            render(
                <ContextProvider Router={Router}>
                    <Route mask="unique/:uid" onEnter={onEnter} />
                </ContextProvider>,
                container
            );
        });

        expect(onEnter).toHaveBeenCalled();
    });

    test('fires on:urlChange if it is created when url matches the mask', () => {
        Router.url.setStateUrl('/unique/555-abc-def');

        const onUrlChange = jest.fn();
        act(() => {
            render(
                <ContextProvider Router={Router}>
                    <Route mask="unique/:uid" onUrlChange={onUrlChange} />
                </ContextProvider>,
                container
            );
        });

        expect(onUrlChange).toHaveBeenCalled();
    });

    test('fires on:leave & on:beforeChange when stops matching url', () => {
        const matchingLocation = { state: '/ctestapp/test/result' };
        const nonMatchingLocation = { state: '/ctestapp' };

        const onBeforeChange = jest.fn();
        const onLeave = jest.fn();
        act(() => {
            render(
                <ContextProvider Router={Router}>
                    <Route mask="test/:value" onBeforeChange={onBeforeChange} onLeave={onLeave} />
                </ContextProvider>,
                container
            );
        });

        act(() => {
            Router.navigate(matchingLocation);
        });

        act(() => {
            Router.navigate(nonMatchingLocation);
        });

        expect(onBeforeChange).toHaveBeenCalled();
        // on:beforeChange
        // expect(onBeforeChange.mock.calls[0][1]).toEqual(
        //     expect.objectContaining(nonMatchingLocation)
        // );
        // expect(onBeforeChange.mock.calls[0][2]).toEqual(expect.objectContaining(matchingLocation));
        expect(onBeforeChange.mock.calls[1][0]).toEqual(
            expect.objectContaining(nonMatchingLocation)
        );
        expect(onBeforeChange.mock.calls[1][1]).toEqual(expect.objectContaining(matchingLocation));
        expect(onLeave).toHaveBeenCalled();
        // on:leave
        expect(onLeave.mock.calls[0][0]).toEqual(expect.objectContaining(nonMatchingLocation));
        expect(onLeave.mock.calls[0][1]).toEqual(expect.objectContaining(matchingLocation));
    });

    test('fires on:urlChange & on:beforeChange when switches between two matched states', () => {
        const currentState = { state: '/ctestapp' };
        const newState = { state: '/ctestapp/two' };

        Router.url.setStateUrl(currentState.state);

        const onBeforeChange = jest.fn();
        const onUrlChange = jest.fn();
        act(() => {
            render(
                <ContextProvider Router={Router}>
                    <Route
                        mask="ctestapp/:value"
                        onBeforeChange={onBeforeChange}
                        onUrlChange={onUrlChange}
                    />
                </ContextProvider>,
                container
            );
        });

        act(() => {
            Router.navigate(newState);
        });

        act(() => {
            Router.navigate(currentState);
        });

        expect(onBeforeChange).toHaveBeenCalled();
        // on:beforeChange
        expect(onBeforeChange.mock.calls[0][0]).toEqual(expect.objectContaining(newState));
        expect(onBeforeChange.mock.calls[0][1]).toEqual(expect.objectContaining(currentState));
        // on:urlChange
        expect(onUrlChange).toHaveBeenCalled();
        expect(onUrlChange.mock.calls[1][0]).toEqual(expect.objectContaining({ value: 'two' }));
        expect(onUrlChange.mock.calls[1][1]).toEqual(expect.objectContaining({ value: '' }));
    });

    test('correctly resolves the url parameters', () => {
        const FnComp = function (props: { value?: string }) {
            return <div>{props.value}</div>;
        };
        act(() => {
            render(
                <ContextProvider Router={Router}>
                    <Route mask="myparam=:value">
                        <FnComp />
                    </Route>
                </ContextProvider>,
                container
            );
        });

        act(() => {
            Router.navigate({ state: '/my/url?myparam=abc&test=true' });
        });

        expect(container.innerHTML).toMatch('<div>abc</div>');
    });

    test('проверка, что Router возьмется из WasabyContext, когда нет router.Context', () => {
        Router.url.setStateUrl('/name/abc');
        const spyGetRootRouter = jest.spyOn(RouterBase, 'getRootRouter');
        const FnComp = function (props: { value?: string }) {
            return <div>{props.value}</div>;
        };
        act(() => {
            render(
                <WasabyContextManager Router={Router}>
                    <Route mask="name/:value">
                        <FnComp />
                    </Route>
                </WasabyContextManager>,
                container
            );
        });

        expect(spyGetRootRouter).not.toHaveBeenCalled();
        expect(container.innerHTML).toMatch('<div>abc</div>');
    });
});
