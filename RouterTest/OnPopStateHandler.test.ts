/**
 * @jest-environment jsdom
 */
import initOnPopState from 'Router/_private/Router/InitOnPopState';
import { IRegisterableComponent } from 'Router/_private/DataInterfaces';
import { createRouter } from './resources/CreateRouter';
import { createFakeControl } from './RouterManager/CreateFakeControl';

const navigationDelay = 80;

describe('onpopstate handler', () => {
    const Router = createRouter();
    initOnPopState(() => {
        return Router;
    });

    let fakeRoute: IRegisterableComponent;

    beforeEach(() => {
        Router.history.setHistory([
            {
                id: 0,
                state: '/ctestapp/page/first',
                href: '/ctestapp/page/first',
            },
            {
                id: 1,
                state: '/ctestapp/page/second',
                href: '/ctestapp/page/second',
            },
        ]);
        Router.history.setHistoryPosition(1);
        Router.url.setStateUrl('/ctestapp/page/second');

        fakeRoute = createFakeControl();
        Router._manager.addRoute(fakeRoute, jest.fn(), jest.fn());
    });

    afterEach(() => {
        Router._manager.removeRoute(fakeRoute);
        jest.restoreAllMocks();
    });

    it('can go back in history', (done) => {
        const historyBackSpy = jest.spyOn(Router.history, 'back').mockName('History_back');
        const fakeEvent = new PopStateEvent('popstate', {
            state: Router.history.getPrevState(),
        });
        window.onpopstate?.(fakeEvent);
        setTimeout(() => {
            try {
                expect(historyBackSpy).toBeCalled();
                done();
            } catch (e) {
                done(e);
            }
        }, navigationDelay);
    });

    it('can go forward in history', (done) => {
        const historyForwardSpy = jest.spyOn(Router.history, 'forward').mockName('History_forward');
        Router.history.setHistoryPosition(0);
        const fakeEvent = new PopStateEvent('popstate', {
            state: Router.history.getNextState(),
        });
        window.onpopstate?.(fakeEvent);
        setTimeout(() => {
            try {
                expect(historyForwardSpy).toBeCalled();
                done();
            } catch (e) {
                done(e);
            }
        }, navigationDelay);
    });

    it('переход вперед когда состояние другое', (done) => {
        // переход вперед по стрелке браузера, когда объект состояния сохраненный в браузере отличается от объекта истории роутера
        Router.history.setHistoryPosition(0);
        const newState = {
            state: '/ctestapp/page/other',
            href: '/ctestapp/page/other',
            id: 1,
        };
        const fakeEvent = new PopStateEvent('popstate', { state: newState });
        window.onpopstate?.(fakeEvent);
        setTimeout(() => {
            try {
                expect(Router.history.getHistoryPosition()).toEqual(1);
                expect(Router.history.getHistory()[Router.history.getHistoryPosition()]).toEqual(
                    expect.objectContaining(newState)
                );
                done();
            } catch (e) {
                done(e);
            }
        }, navigationDelay);
    });

    it('обработка event.state не записанный роутером', (done) => {
        /** Это случай, когда на странице используется Router, но прикладник решил еще сам что-то добавлять
         * в window.history.state. Эти объекты Router не должен никак обрабатывать.
         */
        Router.history.setHistoryPosition(0);
        const fakeEvent = new PopStateEvent('popstate', {
            state: { field: 'data' },
        });
        const navigateSpy = jest.spyOn(Router, 'navigate').mockName('navigate');
        window.onpopstate?.(fakeEvent);
        setTimeout(() => {
            try {
                expect(navigateSpy).not.toBeCalled();
                done();
            } catch (e) {
                done(e);
            }
        }, navigationDelay);
    });
});
