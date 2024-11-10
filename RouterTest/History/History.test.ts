/**
 * @jest-environment jsdom
 */
import UrlRewriter from 'Router/_private/UrlRewriter';
import RouterUrl from 'Router/_private/Router/RouterUrl';
import WindowLocation from 'Router/_private/Router/WindowLocation';
import { IHistoryState } from 'Router/_private/DataInterfaces';
import { SPA_HISTORY_MAX_LENGTH } from 'Router/_private/History';
import HistoryTest from './HistoryTest';

function getFakeHistoryState(id: number, url: string): IHistoryState {
    return {
        id,
        state: url,
        href: url,
    };
}

describe('Router/History', () => {
    const routerUrl = new RouterUrl(new WindowLocation('/signup'), UrlRewriter.getInstance());
    const onChangeHistoryStateSpy = jest.fn();
    const historyInst = new HistoryTest(
        UrlRewriter.getInstance(),
        routerUrl,
        window.history,
        onChangeHistoryStateSpy
    );
    // текущее состояние истории SPA переходов
    const initialHistorySPA = ['/', '/login', '/login?oauth=saby', '/login'];

    beforeEach(() => {
        historyInst.setHistory([
            getFakeHistoryState(0, '/'),
            getFakeHistoryState(1, '/login'),
            getFakeHistoryState(2, '/login?oauth=saby'),
        ]);
        historyInst.setHistoryPosition(1);
        routerUrl.setStateUrl('/login');
        historyInst.setInititalSpaHistory(initialHistorySPA);
        onChangeHistoryStateSpy.mockRestore();
    });

    it('returns the current history state', () => {
        const hstate = historyInst.getCurrentState();
        expect(hstate.id).toEqual(1);
        expect(hstate.state).toEqual('/login');
        expect(hstate.href).toEqual('/login');
    });

    it('returns the previous history state', () => {
        const hstate = historyInst.getPrevState();
        expect(hstate.id).toEqual(0);
        expect(hstate.state).toEqual('/');
        expect(hstate.href).toEqual('/');
    });

    it('returns the next history state', () => {
        const hstate = historyInst.getNextState();
        expect(hstate.id).toEqual(2);
        expect(hstate.state).toEqual('/login?oauth=saby');
        expect(hstate.href).toEqual('/login?oauth=saby');
    });

    describe('#back', () => {
        it('goes to the previous state when possible', () => {
            historyInst.back();
            const hstate = historyInst.getCurrentState();
            expect(hstate.id).toEqual(0);
            expect(routerUrl.getStateUrl()).toEqual(hstate.state);
        });

        it('goes to the pre previous state when possible', () => {
            // переход на 2 позиции назад (в браузере зажать кнопку назад и выбрать состояние раньше предыдущего)
            const history = historyInst.getHistory();
            expect(history.length).toBeGreaterThanOrEqual(3);
            historyInst.setHistoryPosition(2);
            routerUrl.setStateUrl(history[2].state);

            // переход на 2 позиции назад
            historyInst.back(history[0]);

            const hstate = historyInst.getCurrentState();
            expect(hstate.id).toEqual(0);
            expect(routerUrl.getStateUrl()).toEqual(hstate.state);
        });

        it('creates a new starting state if called in first position', () => {
            historyInst.setHistoryPosition(0);
            const startingState = historyInst.getCurrentState();
            expect(historyInst.getPrevState()).toBeUndefined();

            historyInst.back();
            const hstate = historyInst.getCurrentState();
            const expectedHref = routerUrl.getUrl();
            const expectedState =
                (typeof window !== 'undefined' && window.history.state.state) || expectedHref;

            expect(hstate.id).toEqual(-1);
            expect(hstate.state).toEqual(expectedState);
            expect(hstate.href).toEqual(expectedHref);

            expect(historyInst.getNextState()).toEqual(startingState);
        });
    });

    describe('#forward', () => {
        it('goes to the next state when possible', () => {
            historyInst.forward();
            const hstate = historyInst.getCurrentState();
            expect(hstate.id).toEqual(2);
            expect(routerUrl.getStateUrl()).toEqual(hstate.state);
        });

        it('goes to the next next state when possible', () => {
            // переход на 2 позиции вперед (в браузере зажать кнопку вперед и выбрать состояние далее следующего)
            const history = historyInst.getHistory();
            expect(history.length).toBeGreaterThanOrEqual(3);
            historyInst.setHistoryPosition(0);
            routerUrl.setStateUrl(history[0].state);

            // переход на 2 позиции вперед по истории
            historyInst.forward(history[2]);

            const hstate = historyInst.getCurrentState();
            expect(hstate.id).toEqual(2);
            expect(routerUrl.getStateUrl()).toEqual(hstate.state);
        });

        it('creates a new state if called in last position', () => {
            historyInst.setHistoryPosition(2);
            const startingState = historyInst.getCurrentState();
            expect(historyInst.getNextState()).toBeUndefined();

            historyInst.forward();
            const hstate = historyInst.getCurrentState();
            expect(hstate.id).toEqual(3);

            expect(historyInst.getPrevState()).toEqual(startingState);
        });
    });

    describe('#push', () => {
        let pushStateSpy: jest.SpyInstance;

        beforeEach(() => {
            pushStateSpy = jest
                .spyOn(window.history, 'pushState')
                .mockName('window.history.pushState');
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        it('adds a new state if current position is the last one', () => {
            const href = '/profile';
            historyInst.setHistoryPosition(2);
            historyInst.push({ state: '/upage?navigation=profile', href });

            const hstate = historyInst.getCurrentState();
            expect(hstate.id).toEqual(3);
            expect(hstate.state).toEqual('/upage?navigation=profile');
            expect(hstate.href).toEqual(href);

            expect(routerUrl.getStateUrl()).toEqual('/upage?navigation=profile');

            expect(pushStateSpy).toBeCalledTimes(1);
            expect(pushStateSpy.mock.calls[0]).toEqual([hstate, href, href]);
        });

        it('replaces the states after the current one with the new state', () => {
            historyInst.setHistoryPosition(0);
            historyInst.push({
                state: '/upage?navigation=profile',
                href: '/profile',
            });

            const hstate = historyInst.getCurrentState();
            expect(hstate.id).toEqual(1);
            expect(hstate.state).toEqual('/upage?navigation=profile');
            expect(hstate.href).toEqual('/profile');

            expect(pushStateSpy).toBeCalledTimes(1);
            expect(historyInst.getNextState()).toBeUndefined();
        });
    });

    describe('#replaceState', () => {
        let replaceStateSpy: jest.SpyInstance;

        beforeEach(() => {
            replaceStateSpy = jest
                .spyOn(window.history, 'replaceState')
                .mockName('window.history.replaceState');
        });

        afterEach(() => {
            jest.restoreAllMocks();
        });

        /**
         * Тестирование метода History.replaceState в двух сценариях
         * 1) на вход приходит объект со state и href
         * 2) на вход приходит объект со state. а href будет вычислен по state
         * @param {*} newState
         */
        function testReplaceState(newState: IHistoryState): void {
            const href = newState.href || newState.state;

            historyInst.setHistoryPosition(2);
            historyInst.replaceState(newState);

            const hstate = historyInst.getCurrentState();
            expect(hstate.id).toEqual(2);
            expect(hstate.state).toEqual(newState.state);
            expect(hstate.href).toEqual(href);

            expect(routerUrl.getStateUrl()).toEqual(newState.state);

            expect(replaceStateSpy).toBeCalledTimes(1);
            expect(replaceStateSpy.mock.calls[0]).toEqual([hstate, href, href]);
        }

        it('замена в истории текущего состяния', () => {
            // тест метода History.replaceState, когда на вход подаются state и href
            const newState = {
                state: '/upage?navigation=profile',
                href: '/profile',
            };
            testReplaceState(newState);
        });

        it('замена в истории текущего состяния без передачи href', () => {
            // тест метода History.replaceState когда на вход подается ТОЛЬКО state
            // в таком случае, href будет вычислен основываясь на state
            const newState = { state: '/upage?navigation=profile' };
            testReplaceState(newState);
        });
    });

    describe('onChangeHistoryState', () => {
        test('#back', () => {
            historyInst.back();
            const expectedSpaHistory = [...initialHistorySPA, '/'];

            expect(historyInst.getSpaHistory()).toEqual(expectedSpaHistory);
            expect(onChangeHistoryStateSpy.mock.calls[0][0].spaHistory).toEqual(expectedSpaHistory);
            expect(onChangeHistoryStateSpy.mock.calls[0][0].href).toEqual('/');
        });

        test('#forward', () => {
            historyInst.forward();
            const expectedSpaHistory = [...initialHistorySPA, '/login?oauth=saby'];

            expect(historyInst.getSpaHistory()).toEqual(expectedSpaHistory);
            expect(onChangeHistoryStateSpy.mock.calls[0][0].spaHistory).toEqual(expectedSpaHistory);
            expect(onChangeHistoryStateSpy.mock.calls[0][0].href).toEqual('/login?oauth=saby');
        });

        test('#push', () => {
            historyInst.push({ state: '/foo', href: '/profile' });
            const expectedSpaHistory = [...initialHistorySPA, '/profile'];

            expect(historyInst.getSpaHistory()).toEqual(expectedSpaHistory);
            expect(onChangeHistoryStateSpy.mock.calls[0][0].spaHistory).toEqual(expectedSpaHistory);
            expect(onChangeHistoryStateSpy.mock.calls[0][0].href).toEqual('/profile');
        });

        test('#replaceState', () => {
            const newState = { state: '/foo', href: '/profile' };
            historyInst.replaceState(newState);
            const expectedSpaHistory = ['/', '/login', '/login?oauth=saby', '/profile'];

            expect(historyInst.getSpaHistory()).toEqual(expectedSpaHistory);
            expect(onChangeHistoryStateSpy.mock.calls[0][0].spaHistory).toEqual(expectedSpaHistory);
            expect(onChangeHistoryStateSpy.mock.calls[0][0].href).toEqual('/profile');
        });

        test('максимальное количество SPA переходов ограничено', () => {
            for (let i = 0; i <= SPA_HISTORY_MAX_LENGTH; i++) {
                historyInst.push({ state: `/state_${i}`, href: `/href_${i}` });
            }

            expect(historyInst.getSpaHistory().length).toBe(SPA_HISTORY_MAX_LENGTH);
        });
    });
});
