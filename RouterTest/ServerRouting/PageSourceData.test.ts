import * as UIDeps from 'UI/Deps';
import { IRouter, getRootRouter } from 'Router/router';
import { PageSourceData } from 'Router/_ServerRouting/PageSourceData';
import * as IndexModule from 'RouterTest/Index';
import { PageSourceStatus } from 'Router/_ServerRouting/Interfaces/IPageSource';
import { TPageSourceData } from 'Router/_ServerRouting/Interfaces/IPageSourceData';
import { createFakeRequest, fakeRenderOptions } from 'RouterTest/ServerRouting/FakeRenderData';

jest.useFakeTimers();

describe('Router/_ServerRouting/PageSourceData', () => {
    let Router: IRouter;

    beforeEach(() => {
        Router = getRootRouter();
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('получение результата для несуществующего модуля', () => {
        const fakeRequest = createFakeRequest({ path: '/register' });
        const renderData: TPageSourceData = new PageSourceData(fakeRequest).getResult({
            ...fakeRenderOptions,
            Router,
        });

        expect(renderData.hasData).toBe(false);
        if (renderData.hasData === false) {
            expect(renderData.notFound.status).toEqual(PageSourceStatus.NOT_FOUND);
        }
    });

    it('получение результата для существующего модуля', () => {
        const fakeRequest = createFakeRequest({ path: '/RouterTest' });

        // заглушка метода проверки существования модуля, который строим
        const isModuleExistsOriginal = UIDeps.isModuleExists.bind(UIDeps);
        jest.spyOn(UIDeps, 'isModuleExists').mockImplementation((module) => {
            if (module === 'RouterTest/Index') {
                return true;
            }

            return isModuleExistsOriginal(module);
        });

        const renderData: TPageSourceData = new PageSourceData(fakeRequest).getResult({
            ...fakeRenderOptions,
            Router,
        });

        expect(renderData.hasData).toBe(true);
        if (renderData.hasData === true) {
            expect(renderData.moduleName).toBe('RouterTest/Index');
            expect(renderData.dataToRender).toBeInstanceOf(Promise);
        }
    });

    it('передача req.url в метод getDataToRender', () => {
        const fakeRequest = createFakeRequest({
            path: '/RouterTest',
            originalUrl: '/service/RouterTest/?from=landing',
            url: '/RouterTest/?from=landing',
            baseUrl: '/service',
        });

        // заглушка метода проверки существования модуля, который строим
        const isModuleExistsOriginal = UIDeps.isModuleExists.bind(UIDeps);
        jest.spyOn(UIDeps, 'isModuleExists').mockImplementation((module) => {
            if (module === 'RouterTest/Index') {
                return true;
            }

            return isModuleExistsOriginal(module);
        });

        // заглушка метода getDataToRender, чтобы проверить как он был вызван
        const getDataToRenderStub = jest.spyOn(IndexModule, 'getDataToRender');

        new PageSourceData(fakeRequest).getResult({
            ...fakeRenderOptions,
            Router,
        });

        // Должен быть вызван метод получения данных
        expect(getDataToRenderStub).toHaveBeenCalledTimes(1);
        expect(getDataToRenderStub).toHaveBeenCalledWith(
            fakeRequest.url,
            expect.objectContaining({ ...fakeRenderOptions, Router, prerender: false }),
            Router
        );
    });

    describe('404 при попытке построить файл вместо пути', () => {
        beforeEach(() => {
            // заглушка метода проверки существования модуля, который строим
            const isModuleExistsOriginal = UIDeps.isModuleExists.bind(UIDeps);
            jest.spyOn(UIDeps, 'isModuleExists').mockImplementation((module) => {
                if (module === 'RouterTest/Index') {
                    return true;
                }
                return isModuleExistsOriginal(module);
            });
        });

        it('.js в конце пути', () => {
            const fakeRequest = createFakeRequest({ path: '/RouterTest/Env/Env.js' });

            const renderData: TPageSourceData = new PageSourceData(fakeRequest).getResult({
                ...fakeRenderOptions,
                Router,
            });

            expect(renderData.hasData).toBe(false);
            if (renderData.hasData === false) {
                expect(renderData.notFound.status).toEqual(PageSourceStatus.NOT_FOUND);
            }
        });

        it('/json в конце пути не "ломает" построение страницы', () => {
            const fakeRequest = createFakeRequest({ path: '/RouterTest/Env/Env/json' });

            const renderData: TPageSourceData = new PageSourceData(fakeRequest).getResult({
                ...fakeRenderOptions,
                Router,
            });

            expect(renderData.hasData).toBe(true);
        });
    });
});
