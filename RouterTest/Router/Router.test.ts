/**
 * @jest-environment jsdom
 */
import { IRegisterableComponent } from 'Router/_private/DataInterfaces';
import { createRouter } from '../resources/CreateRouter';
import * as fakeAppManager from '../resources/fakeAppManager';
import { createFakeControl } from '../RouterManager/CreateFakeControl';
import RouterManager from 'Router/_private/Router/RouterManager';

const navigationDelay = 80;

describe('Router/Router', () => {
    let fakeRoute: IRegisterableComponent;
    let fakeReference: IRegisterableComponent;
    const Router = createRouter();

    beforeAll(() => {
        // define a fake ctestapp/Index component so tests
        // do not do redirects
        fakeAppManager.createFakeApp('ctestapp');
    });

    beforeEach(() => {
        fakeRoute = createFakeControl();
        fakeReference = createFakeControl();

        Router._manager.addRoute(fakeRoute, jest.fn(), jest.fn());
        Router._manager.addReference(fakeReference, jest.fn());
        Router.url.setStateUrl('/ctestapp/random/url');
        Router.history.setHistory([
            {
                id: 0,
                state: '/ctestapp/random/url',
                href: '/ctestapp/random/url',
            },
        ]);
        Router.history.setHistoryPosition(0);
    });

    afterEach(() => {
        Router._manager.removeRoute(fakeRoute);
        Router._manager.removeReference(fakeReference);

        // @ts-ignore
        fakeRoute = null;
        // @ts-ignore
        fakeReference = null;

        jest.restoreAllMocks();
    });

    describe('#navigate', () => {
        test('вызываются beforeUrlChange-коллбеки', (done) => {
            const callBeforeUrlChangeSpy = jest
                .spyOn(RouterManager.prototype, 'callBeforeUrlChange')
                .mockName('callBeforeUrlChange');
            Router.navigate({ state: '/ctestapp/other/url' }, () => {
                try {
                    expect(callBeforeUrlChangeSpy).toBeCalled();
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });

        test('вызываются afterUrlChange-коллбеки', (done) => {
            const callAfterUrlChangeSpy = jest
                .spyOn(RouterManager.prototype, 'callAfterUrlChange')
                .mockName('callAfterUrlChange');
            Router.navigate({ state: '/ctestapp/other/url' }, () => {
                setTimeout(() => {
                    try {
                        expect(callAfterUrlChangeSpy).toBeCalled();
                        done();
                    } catch (e) {
                        done(e);
                    }
                }, navigationDelay);
            });
        });

        test('не вызовет navigate если beforeUrlChange-коллбеки вернут false', (done) => {
            // beforeUrlChangeCb возвращает Promise<false>
            const callBeforeUrlChangeSpy = jest
                .spyOn(RouterManager.prototype, 'callBeforeUrlChange')
                .mockName('callBeforeUrlChange')
                .mockReturnValue(Promise.resolve(false));
            const callAfterUrlChangeSpy = jest
                .spyOn(RouterManager.prototype, 'callAfterUrlChange')
                .mockName('callAfterUrlChange');
            Router.navigate(
                { state: '/ctestapp/other/url' },
                () => {
                    done(new Error('expected callback not to be called'));
                },
                () => {
                    try {
                        expect(callBeforeUrlChangeSpy).toBeCalled();
                        expect(callAfterUrlChangeSpy).not.toBeCalled();
                        done();
                    } catch (e) {
                        done(e);
                    }
                }
            );
        });

        test('вызовет History.push', (done) => {
            const historyPushSpy = jest.spyOn(Router.history, 'push').mockName('History_push');
            const newState = '/ctestapp/other/url';
            Router.navigate({ state: newState });
            setTimeout(() => {
                try {
                    expect(historyPushSpy).toBeCalledTimes(1);
                    expect(historyPushSpy).toBeCalledWith(
                        expect.objectContaining({
                            state: newState,
                            href: newState,
                        })
                    );
                    done();
                } catch (e) {
                    done(e);
                }
            }, navigationDelay);
        });

        test('вызовет History.push с заданным href', (done) => {
            const historyPushSpy = jest.spyOn(Router.history, 'push').mockName('History_push');
            const newState = '/ctestapp/new/state';
            const newHref = '/new';
            Router.navigate({ state: newState, href: newHref });
            setTimeout(() => {
                try {
                    expect(historyPushSpy).toBeCalledWith(
                        expect.objectContaining({
                            state: newState,
                            href: newHref,
                        })
                    );
                    done();
                } catch (e) {
                    done(e);
                }
            }, navigationDelay);
        });

        test('вызовет History.push когда переданный callback вернет true', (done) => {
            const historyPushSpy = jest.spyOn(Router.history, 'push').mockName('History_push');
            const newState = '/ctestapp/other/state';
            const newHref = '/new';
            const callback = () => {
                return true;
            };
            Router.navigate({ state: newState, href: newHref }, callback);
            setTimeout(() => {
                try {
                    expect(historyPushSpy).toBeCalledWith(
                        expect.objectContaining({
                            state: newState,
                            href: newHref,
                        })
                    );
                    done();
                } catch (e) {
                    done(e);
                }
            }, navigationDelay);
        });

        test('rewrites the url when needed', (done) => {
            const historyPushSpy = jest.spyOn(Router.history, 'push').mockName('History_push');
            const newState = '/ctestapp/rewritten/state';
            jest.spyOn(Router.urlRewriter, 'get').mockReturnValue('/ctestapp/rstate');
            jest.spyOn(Router.urlRewriter, 'getReverse').mockReturnValue(newState);

            Router.navigate({ state: newState });
            setTimeout(() => {
                try {
                    expect(historyPushSpy).toBeCalledTimes(1);
                    expect(historyPushSpy).toBeCalledWith(
                        expect.objectContaining({
                            state: '/ctestapp/rstate',
                            href: newState,
                        })
                    );
                    done();
                } catch (e) {
                    done(e);
                }
            }, navigationDelay);
        });
    });

    describe('#replaceState', () => {
        test('вызовет navigate', () => {
            const navigateSpy = jest.spyOn(Router, 'navigate').mockName('navigate');
            const newState = '/ctestapp/other/url';
            Router.replaceState({ state: newState });

            expect(navigateSpy).toBeCalledTimes(1);
            expect(navigateSpy.mock.calls[0][0]).toEqual(
                expect.objectContaining({ state: newState, href: newState })
            );
        });

        test('вызовет navigate с заданным href', () => {
            const navigateSpy = jest.spyOn(Router, 'navigate').mockName('navigate');
            const newState = '/ctestapp/other/url';
            const newHref = '/new';
            Router.replaceState({ state: newState, href: newHref });

            expect(navigateSpy).toBeCalledTimes(1);
            expect(navigateSpy.mock.calls[0][0]).toEqual(
                expect.objectContaining({ state: newState, href: newHref })
            );
        });

        test('вызовет History.replaceState', () => {
            const replaceStateSpy = jest
                .spyOn(Router.history, 'replaceState')
                .mockName('replaceState');
            const newState = '/ctestapp/other/url';
            Router.replaceState({ state: newState });

            expect(replaceStateSpy).toBeCalledTimes(1);
            expect(replaceStateSpy).toBeCalledWith(
                expect.objectContaining({ state: newState, href: newState })
            );
        });

        test('вызовет переданную callback-функцию', () => {
            const callbackSpy = jest.fn().mockName('callback');
            const newState = '/ctestapp/other/url';
            Router.replaceState({ state: newState }, callbackSpy);

            expect(callbackSpy).toBeCalledTimes(1);
            expect(callbackSpy).toBeCalledWith(
                expect.objectContaining({ state: newState, href: newState })
            );
        });
    });
});
