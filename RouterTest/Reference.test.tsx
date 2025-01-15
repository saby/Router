/**
 * @jest-environment jsdom
 */
import { render, unmountComponentAtNode } from 'react-dom';
import { act } from 'react-dom/test-utils';
import { WasabyContextManager } from 'UI/Contexts';
import { App } from 'Application/Env';
import { constants, detection } from 'Env/Env';
import { Reference, Route, ContextProvider } from 'Router/router';
// @ts-ignore
import * as defaultRouterJson from 'router';
import ReferenceTest from 'RouterTest/resources/ReferenceTest';
import ReferenceInWml from 'RouterTest/resources/ReferenceInWml';
import UrlRewriterTest from './UrlRewriter/UrlRewriterTest';
import * as fakeAppManager from './resources/fakeAppManager';
import { createRouter } from './resources/CreateRouter';
import RouterManager from 'Router/_private/Router/RouterManager';
import { Reference as BaseReference } from 'Router/_private/Reference';

describe('Router/Reference', () => {
    let container: HTMLElement;
    let compat: boolean;
    const Router = createRouter();
    let configState: Record<string, any>;

    beforeAll(() => {
        // define a fake ctestapp/Index component so tests
        // do not do redirects
        fakeAppManager.createFakeApp('TestModule');

        compat = constants.compat;
        constants.compat = false;

        UrlRewriterTest._createNewInstance({
            '/orders': 'TestModule/page/orders',
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
        Router.url.setStateUrl('/orders');
        Router.history.setHistory([
            {
                id: 0,
                state: '/orders',
                href: '/orders',
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
        configState = App.getRequest().getConfig().getState();
        App.getRequest().getConfig().setState({ appRoot: '/' });

        // eslint-disable-next-line no-console
        const errMsg = console.error;
        jest.spyOn(console, 'error').mockImplementation(function (...args) {
            if (!args || !args[1] || args[1].indexOf('onMouseOverCallback') < 0) {
                errMsg(...args);
            }
        });
    });

    afterEach(() => {
        unmountComponentAtNode(container);
        container.remove();
        App.getRequest().getConfig().setState(configState);
    });

    test('registers when created', () => {
        const addReferenceSpy = jest
            .spyOn(RouterManager.prototype, 'addReference')
            .mockName('addReference');
        act(() => {
            render(
                <ContextProvider Router={Router}>
                    <Reference state="name/:value" value="test">
                        <a>link</a>
                    </Reference>
                </ContextProvider>,
                container
            );
        });

        expect(addReferenceSpy).toBeCalledTimes(1);
        expect(addReferenceSpy.mock.calls[0][0]).toBeInstanceOf(BaseReference);
    });

    test('unregisters when destroyed', () => {
        const removeReferenceSpy = jest
            .spyOn(RouterManager.prototype, 'removeReference')
            .mockName('removeReference');
        act(() => {
            render(
                <ContextProvider Router={Router}>
                    <Reference state="name/:value" value="test">
                        <a>link</a>
                    </Reference>
                </ContextProvider>,
                container
            );
        });

        // unmount контрола и вызов _beforeUnmount
        act(() => {
            unmountComponentAtNode(container);
        });

        expect(removeReferenceSpy).toBeCalledTimes(1);
        expect(removeReferenceSpy.mock.calls[0][0]).toBeInstanceOf(BaseReference);
    });

    test('correctly calculates the state', () => {
        Router.url.setStateUrl('/name/value');

        act(() => {
            render(
                <ContextProvider Router={Router}>
                    <Reference state="test/:tvalue" tvalue="true">
                        <a>link</a>
                    </Reference>
                </ContextProvider>,
                container
            );
        });

        expect(container.innerHTML).toMatch('<a href="/name/value/test/true">link</a>');
    });

    test('updates the state when url changes', async () => {
        Router.url.setStateUrl('/name/value');

        act(() => {
            render(
                <WasabyContextManager Router={Router}>
                    <Route mask="/">
                        <Reference state="test/:tvalue" tvalue="true">
                            <a>link</a>
                        </Reference>
                    </Route>
                </WasabyContextManager>,
                container
            );
        });

        // update
        act(() => {
            Router.navigate({ state: '/my/test/false/abc' });
        });

        expect(container.innerHTML).toMatch('<a href="/my/test/true/abc">link</a>');
    });

    test('correctly calculates the mask-href', () => {
        Router.url.setStateUrl('/random/url/here?test=true');

        act(() => {
            render(
                <ContextProvider Router={Router}>
                    <Reference state="url/:location" location="website" href="/:location">
                        <a>link</a>
                    </Reference>
                </ContextProvider>,
                container
            );
        });

        expect(container.innerHTML).toMatch('<a href="/website">link</a>');
    });

    test('correctly calculates the href', () => {
        Router.url.setStateUrl('/orders/certificates');

        act(() => {
            render(
                <ContextProvider Router={Router}>
                    <Reference state="/orders" href="/orders">
                        <a>link</a>
                    </Reference>
                </ContextProvider>,
                container
            );
        });

        expect(container.innerHTML).toMatch('<a href="/orders">link</a>');
    });

    test('correctly calculates the href with trailing slash in url', () => {
        Router.url.setStateUrl('/orders/certificates/');

        act(() => {
            render(
                <ContextProvider Router={Router}>
                    <Reference state="/orders">
                        <a>link</a>
                    </Reference>
                </ContextProvider>,
                container
            );
        });

        expect(container.innerHTML).toMatch('<a href="/orders/">link</a>');
    });

    test('correctly calculates the href with trailing slash in mask', () => {
        Router.url.setStateUrl('/orders/certificates');

        act(() => {
            render(
                <ContextProvider Router={Router}>
                    <Reference state="/orders/" trailingSlash={true}>
                        <a>link</a>
                    </Reference>
                </ContextProvider>,
                container
            );
        });

        expect(container.innerHTML).toMatch('<a href="/orders/">link</a>');
    });

    test('correctly calculates the href for root with /service', () => {
        App.getRequest().getConfig().setState({ appRoot: '/service/' });
        Router.url.setStateUrl('/orders');

        act(() => {
            render(
                <ContextProvider Router={Router}>
                    <Reference state="/">
                        <a>link</a>
                    </Reference>
                </ContextProvider>,
                container
            );
        });

        expect(container.innerHTML).toMatch('<a href="/service/">link</a>');
    });

    test('correctly calculates the href for some path with /service', () => {
        App.getRequest().getConfig().setState({ appRoot: '/service/' });
        Router.url.setStateUrl('/orders/certificates');

        act(() => {
            render(
                <ContextProvider Router={Router}>
                    <Reference state="/orders">
                        <a>link</a>
                    </Reference>
                </ContextProvider>,
                container
            );
        });

        expect(container.innerHTML).toMatch('<a href="/service/orders">link</a>');
    });

    test('updates the href when option changes', () => {
        Router.url.setStateUrl('/random/url/here?test=true');

        const options = {
            state: 'url/:location',
            href: '/:location',
            location: 'website',
        };
        let instance: ReferenceTest | null;
        act(() => {
            render(
                <ContextProvider Router={Router}>
                    <ReferenceTest
                        ref={(v) => {
                            if (v) {
                                instance = v;
                            }
                        }}
                        {...options}
                    >
                        <a>link</a>
                    </ReferenceTest>
                </ContextProvider>,
                container
            );
        });

        // update
        act(() => {
            instance?.updateLocation('book');
        });

        expect(container.innerHTML).toMatch('<a href="/book">link</a>');
    });

    test('navigates when mousedowned', () => {
        const navigateSpy = jest.spyOn(Router, 'navigate').mockImplementation();

        act(() => {
            render(
                <ContextProvider Router={Router}>
                    <Reference state="name/:value" value="test">
                        <a>link</a>
                    </Reference>
                </ContextProvider>,
                container
            );
        });

        act(() => {
            container
                ?.querySelector('a')
                ?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
            jest.runAllTimers();
        });

        expect(navigateSpy).toBeCalledTimes(1);
    });

    test('open link: mousedown with Ctrl key', () => {
        const navigateSpy = jest.spyOn(Router, 'navigate').mockImplementation();
        const clickPreventSpy = jest
            .spyOn(MouseEvent.prototype, 'preventDefault')
            .mockImplementation();

        act(() => {
            render(
                <ContextProvider Router={Router}>
                    <Reference state="/path">
                        <a>link</a>
                    </Reference>
                </ContextProvider>,
                container
            );
        });

        act(() => {
            const anchor = container.querySelector('a');
            anchor?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, ctrlKey: true }));
            anchor?.dispatchEvent(new MouseEvent('click', { bubbles: true, ctrlKey: true }));
            jest.runAllTimers();
        });

        expect(navigateSpy).not.toBeCalled();
        expect(clickPreventSpy).not.toBeCalled();
    });

    test('open link: mousedown with Cmd key on MacOs', () => {
        jest.spyOn(detection, 'isMacOSDesktop', 'get').mockReturnValue(true);
        const navigateSpy = jest.spyOn(Router, 'navigate').mockImplementation();
        const clickPreventSpy = jest
            .spyOn(MouseEvent.prototype, 'preventDefault')
            .mockImplementation();

        act(() => {
            render(
                <ContextProvider Router={Router}>
                    <Reference state="/path">
                        <a>link</a>
                    </Reference>
                </ContextProvider>,
                container
            );
        });

        act(() => {
            const anchor = container.querySelector('a');
            anchor?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, metaKey: true }));
            anchor?.dispatchEvent(new MouseEvent('click', { bubbles: true, metaKey: true }));
            jest.runAllTimers();
        });

        expect(navigateSpy).not.toBeCalled();
        expect(clickPreventSpy).not.toBeCalled();
    });

    test('open link: middle btn click', () => {
        const navigateSpy = jest.spyOn(Router, 'navigate').mockImplementation();
        const clickPreventSpy = jest
            .spyOn(MouseEvent.prototype, 'preventDefault')
            .mockImplementation();

        act(() => {
            render(
                <ContextProvider Router={Router}>
                    <Reference state="/path">
                        <a>link</a>
                    </Reference>
                </ContextProvider>,
                container
            );
        });

        act(() => {
            const anchor = container.querySelector('a');
            anchor?.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 1 }));
            anchor?.dispatchEvent(new MouseEvent('click', { bubbles: true, button: 1 }));
            jest.runAllTimers();
        });

        expect(navigateSpy).not.toBeCalled();
        expect(clickPreventSpy).not.toBeCalled();
    });

    test('проверка, что Router возьмется из WasabyContext, когда нет router.Context', () => {
        Router.url.setStateUrl('/name/value');

        act(() => {
            render(
                <WasabyContextManager Router={Router}>
                    <Reference state="test/:tvalue" tvalue="true">
                        <a>link</a>
                    </Reference>
                </WasabyContextManager>,
                container
            );
        });

        expect(container.innerHTML).toMatch('<a href="/name/value/test/true">link</a>');
    });

    // Здесь проверяем, что если Reference вставили в корень Wasaby-контрола,
    // то у этого Wasaby-контрола будет установлен _container (<a/>) и его события будут работать
    test('При вставке в wml, прокидывает ref до children', () => {
        Router.url.setStateUrl('/random/url/here?test=true');

        const options = {
            state: 'url/:location',
            href: '/:location',
            location: 'website',
        };
        let instance: ReferenceInWml | null = null;
        act(() => {
            render(
                <ContextProvider Router={Router}>
                    <ReferenceInWml
                        ref={(v: ReferenceInWml) => {
                            if (v) {
                                instance = v;
                            }
                        }}
                        {...options}
                    >
                        <a>link</a>
                    </ReferenceInWml>
                </ContextProvider>,
                container
            );
        });

        // @ts-ignore
        const anchor = instance._container;

        expect(anchor).toBeInstanceOf(HTMLAnchorElement);
    });
});
