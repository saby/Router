import RouterManagerTest from './RouterManagerTest';
import { createFakeControl } from './CreateFakeControl';

describe('Router/RouterManager', () => {
    let routerManager: RouterManagerTest;

    beforeEach(() => {
        routerManager = new RouterManagerTest();
    });

    describe('#addRoute/#removeRoute', () => {
        test('добавление и удаление обработчиков Route', () => {
            const fakeRoute = createFakeControl();

            routerManager.addRoute(fakeRoute, jest.fn(), jest.fn());
            expect(routerManager.getRegisteredRoutes()).toHaveProperty([
                fakeRoute.getInstanceId(),
            ]);

            routerManager.removeRoute(fakeRoute);
            expect(routerManager.getRegisteredRoutes()).not.toHaveProperty([
                fakeRoute.getInstanceId(),
            ]);
        });
    });

    describe('#addReference/#removeReference', () => {
        test('добавление и удаление обработчиков Reference', () => {
            const fakeReference = createFakeControl();

            routerManager.addReference(fakeReference, jest.fn());
            expect(routerManager.getRegisteredReferences()).toHaveProperty([
                fakeReference.getInstanceId(),
            ]);

            routerManager.removeReference(fakeReference);
            expect(routerManager.getRegisteredReferences()).not.toHaveProperty([
                fakeReference.getInstanceId(),
            ]);
        });
    });

    describe('вызов коллбеков', () => {
        test('вызов beforeUrlChange-коллбека Route', () => {
            const fakeRoute = createFakeControl();
            const beforeUrlChangeCb = jest.fn();
            routerManager.addRoute(fakeRoute, beforeUrlChangeCb, jest.fn());
            routerManager.callBeforeUrlChange(
                { state: '/' },
                { state: '/path' }
            );

            expect(beforeUrlChangeCb).toBeCalled();
        });

        test('вызов afterUrlChange-коллбека Route', () => {
            const fakeRoute = createFakeControl();
            const afterUrlChangeCb = jest.fn();
            routerManager.addRoute(fakeRoute, jest.fn(), afterUrlChangeCb);
            routerManager.callAfterUrlChange(
                { state: '/' },
                { state: '/path' }
            );

            expect(afterUrlChangeCb).toBeCalled();
        });

        test('вызов afterUrlChange-коллбека Reference', () => {
            const fakeReference = createFakeControl();
            const afterUrlChangeCb = jest.fn();
            routerManager.addReference(fakeReference, afterUrlChangeCb);
            routerManager.callAfterUrlChange(
                { state: '/' },
                { state: '/path' }
            );

            expect(afterUrlChangeCb).toBeCalled();
        });

        test('нет ни одного beforeUrlChange-коллбека', () => {
            const result = routerManager.callBeforeUrlChange(
                { state: '/' },
                { state: '/path' }
            );

            expect(result).toBe(false);
        });

        test('beforeUrlChange-коллбек вернул false', () => {
            const fakeRoute = createFakeControl();
            const beforeUrlChangeCb = () => {
                return false;
            };
            routerManager.addRoute(fakeRoute, beforeUrlChangeCb, jest.fn());
            const result = routerManager.callBeforeUrlChange(
                { state: '/' },
                { state: '/path' }
            );

            expect(result).toBe(false);
        });

        test('beforeUrlChange-коллбек вернул Promise<false>', () => {
            const fakeRoute = createFakeControl();
            const beforeUrlChangeCb = () => {
                return Promise.resolve(false);
            };
            routerManager.addRoute(fakeRoute, beforeUrlChangeCb, jest.fn());
            const result = routerManager.callBeforeUrlChange(
                { state: '/' },
                { state: '/path' }
            );

            expect(result).toBeInstanceOf(Promise);
            return expect(result).resolves.toBe(false);
        });
    });
});
