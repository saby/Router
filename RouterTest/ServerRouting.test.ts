import { logger } from 'Application/Env';
import * as UIDeps from 'UI/Deps';
import { getPageSource } from 'Router/ServerRouting';
import {
    fakeRenderOptions,
    createFakeRequest,
} from 'RouterTest/ServerRouting/FakeRenderData';

jest.useFakeTimers();

describe('Router/ServerRouting', () => {
    beforeEach(() => {
        jest.spyOn(logger, 'info').mockImplementation();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('построение несуществующего модуля', (done) => {
        const fakeRequest = createFakeRequest({ path: '/register' });
        // заглушка метода проверки существования модуля, который строим
        const isModuleExistsStub = jest
            .spyOn(UIDeps, 'isModuleExists')
            .mockImplementation(jest.fn());
        const onSuccessHandler = jest.fn();
        const onNotFoundHandler = jest.fn();

        getPageSource(
            fakeRenderOptions,
            fakeRequest,
            onSuccessHandler,
            onNotFoundHandler
        )
            .then((pageSource) => {
                // Должен быть вызван метод проверки существования модуля
                expect(isModuleExistsStub).toHaveBeenCalledTimes(1);
                expect(isModuleExistsStub).toHaveBeenCalledWith(
                    'register/Index'
                );

                // Шаблон страницы не должен был построиться, т.к. модуль register/Index не существует
                expect(onSuccessHandler).not.toHaveBeenCalled();
                expect(onNotFoundHandler).toHaveBeenCalled();

                expect(pageSource).toHaveProperty('status');
                expect(pageSource).toHaveProperty('error');
            })
            .then(done, done);
    });

    it('успешное построение страницы', (done) => {
        const fakeRequest = createFakeRequest({ path: '/RouterTest' });

        // заглушка метода проверки существования модуля, который строим
        const isModuleExistsOrigin = UIDeps.isModuleExists.bind(UIDeps);
        const isModuleExistsStub = jest
            .spyOn(UIDeps, 'isModuleExists')
            .mockImplementationOnce((module) => {
                if (module === 'RouterTest/Index') {
                    return true;
                }

                return isModuleExistsOrigin(module);
            });
        const onSuccessHandler = jest.fn();
        const onNotFoundHandler = jest.fn();

        getPageSource(
            fakeRenderOptions,
            fakeRequest,
            onSuccessHandler,
            onNotFoundHandler
        )
            .then((pageSource) => {
                // Должен быть вызван метод проверки существования модуля
                expect(isModuleExistsStub).toHaveBeenCalledTimes(1);
                expect(isModuleExistsStub).toHaveBeenCalledWith(
                    'RouterTest/Index'
                );

                // Шаблон страницы должен был построиться
                expect(onSuccessHandler).toHaveBeenCalled();
                expect(onNotFoundHandler).not.toHaveBeenCalled();

                expect(pageSource).toHaveProperty('status');
                expect(pageSource).toHaveProperty('html');
            })
            .then(done, done);
    });
});
