/**
 * @jest-environment jsdom
 */
import { RefCallback } from 'react';
import { unmountComponentAtNode } from 'react-dom';
import { act } from 'react-dom/test-utils';
import { Control } from 'UI/Base';
import { constants } from 'Env/Env';
import { Route } from 'Router/router';
import { createRouter } from './resources/CreateRouter';
import RouterManager from 'Router/_private/Router/RouterManager';
import * as fakeAppManager from './resources/fakeAppManager';

interface ITestControlOptions {
    mask?: string;
    ref?: RefCallback<any>;
}

describe('Router/Route', () => {
    let container: HTMLElement;
    let compat: boolean;
    const Router = createRouter();

    function createControl(options: ITestControlOptions & Record<string, any>): Control {
        return Control.createControl(
            Route,
            // @ts-ignore
            { mask: 'name/:value', Router, ...options },
            container
        );
    }

    beforeAll(() => {
        // define a fake ctestapp/Index component so tests
        // do not do redirects
        fakeAppManager.createFakeApp('ctestapp');

        compat = constants.compat;
        constants.compat = false;
    });

    afterAll(() => {
        constants.compat = compat;
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
        let control;
        act(() => {
            createControl({
                ref: (v) => {
                    control = v;
                },
            });
            jest.runAllTimers(); // _afterMount
        });

        expect(addRouteSpy).toBeCalledTimes(1);
        expect(addRouteSpy.mock.calls[0][0]).toEqual(control);
    });

    test('unregisters when destroyed', () => {
        const removeRouteSpy = jest
            .spyOn(RouterManager.prototype, 'removeRoute')
            .mockName('removeRoute');
        let control;
        act(() => {
            createControl({
                ref: (v) => {
                    if (v) {
                        control = v;
                    }
                },
            });
            jest.runAllTimers(); // _afterMount
        });

        // unmount контрола и вызов _beforeUnmount
        act(() => {
            unmountComponentAtNode(container);
        });

        expect(removeRouteSpy).toBeCalledTimes(1);
        expect(removeRouteSpy.mock.calls[0][0]).toEqual(control);
    });

    test('fires on:enter & on:beforeChange when starts matching url', () => {
        const currentState = { state: '/ctestapp' };
        const newState = { state: '/ctestapp/test/result' };
        const onBeforeChange = jest.fn();
        const onEnter = jest.fn();
        act(() => {
            createControl({
                mask: 'test/:value',
                onBeforeChange,
                onEnter,
            });
            jest.runAllTimers(); // _afterMount
        });

        act(() => {
            Router.navigate(newState);
        });

        expect(onBeforeChange).toBeCalled();
        // on:beforeChange
        expect(onBeforeChange.mock.calls[0][0]).toEqual(expect.objectContaining(newState));
        expect(onBeforeChange.mock.calls[0][1]).toEqual(expect.objectContaining(currentState));

        expect(onEnter).toBeCalled();
        // on:enter
        expect(onEnter.mock.calls[0][0]).toEqual(expect.objectContaining(newState));
        expect(onEnter.mock.calls[0][1]).toEqual(expect.objectContaining(currentState));
    });

    test('fires on:enter if it is created when url matches the mask', () => {
        Router.url.setStateUrl('/unique/555-abc-def');

        const onEnter = jest.fn();
        act(() => {
            createControl({
                mask: 'unique/:uid',
                onEnter,
            });
        });

        act(() => {
            jest.runAllTimers(); // _afterMount
        });

        expect(onEnter).toBeCalled();
    });

    test('fires on:urlChange if it is created when url matches the mask', () => {
        Router.url.setStateUrl('/unique/555-abc-def');

        const onUrlChange = jest.fn();
        act(() => {
            createControl({
                mask: 'unique/:uid',
                onUrlChange,
            });
        });

        act(() => {
            jest.runAllTimers(); // _afterMount
        });

        expect(onUrlChange).toBeCalled();
    });

    test('fires on:leave & on:beforeChange when stops matching url', () => {
        const matchingLocation = { state: '/ctestapp/test/result' };
        const nonMatchingLocation = { state: '/ctestapp' };

        const onBeforeChange = jest.fn();
        const onLeave = jest.fn();
        act(() => {
            createControl({
                mask: 'test/:value',
                onBeforeChange,
                onLeave,
            });
            jest.runAllTimers(); // _afterMount
        });

        act(() => {
            Router.navigate(matchingLocation);
        });

        act(() => {
            Router.navigate(nonMatchingLocation);
        });

        expect(onBeforeChange).toBeCalled();
        // on:beforeChange
        // expect(onBeforeChange.mock.calls[0][1]).toEqual(
        //     expect.objectContaining(nonMatchingLocation)
        // );
        // expect(onBeforeChange.mock.calls[0][2]).toEqual(expect.objectContaining(matchingLocation));
        expect(onBeforeChange.mock.calls[1][0]).toEqual(
            expect.objectContaining(nonMatchingLocation)
        );
        expect(onBeforeChange.mock.calls[1][1]).toEqual(expect.objectContaining(matchingLocation));
        expect(onLeave).toBeCalled();
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
            createControl({
                mask: 'ctestapp/:value',
                onBeforeChange,
                onUrlChange,
            });
            jest.runAllTimers(); // _afterMount
        });

        act(() => {
            Router.navigate(newState);
        });

        act(() => {
            Router.navigate(currentState);
        });

        expect(onBeforeChange).toBeCalled();
        // on:beforeChange
        expect(onBeforeChange.mock.calls[0][0]).toEqual(expect.objectContaining(newState));
        expect(onBeforeChange.mock.calls[0][1]).toEqual(expect.objectContaining(currentState));
        // on:urlChange
        expect(onUrlChange).toBeCalled();
        expect(onUrlChange.mock.calls[1][0]).toEqual(expect.objectContaining({ value: 'two' }));
        expect(onUrlChange.mock.calls[1][1]).toEqual(expect.objectContaining({ value: '' }));
    });

    test('correctly resolves the url parameters', () => {
        let control: { setState: (value: any) => void; _urlOptions: { value: any } };
        act(() => {
            createControl({
                mask: 'myparam=:value',
                ref: (v) => {
                    if (v) {
                        control = v;
                    }
                },
            });
            jest.runAllTimers();
        });

        Router.url.setStateUrl('/my/url?myparam=abc&test=true');

        // update
        act(() => {
            control?.setState({});
            jest.runAllTimers();
        });

        // @ts-ignore
        expect(control?._urlOptions.value).toBe('abc');
    });
});
