import { IRouter, getRootRouter } from 'Router/router';
import { DataToRender } from 'Router/_ServerRouting/DataToRender';
import { IModuleFound } from 'Router/_ServerRouting/Interfaces/IModuleLoader';
import { IDataToRenderNotExist } from 'Router/_ServerRouting/Interfaces/IPageSourceData';
import * as IndexModule from 'RouterTest/Index';
import { fakeRenderOptions } from 'RouterTest/ServerRouting/FakeRenderData';

jest.useFakeTimers();

describe('Router/_ServerRouting/DataToRender', () => {
    const moduleName = 'RouterTest/Index';
    const requestPath = '/url';
    let Router: IRouter;

    beforeEach(() => {
        Router = getRootRouter();
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('вызов getDataToRender модуля', async () => {
        const loadResult: IModuleFound = {
            loadStatus: 'success',
            module: IndexModule,
        };
        const getDataToRenderOriginal = loadResult.module.getDataToRender?.bind(loadResult.module);

        // заглушка метода getDataToRender, чтобы он возвращал что нужно
        const getDataToRenderStub = jest
            .spyOn(loadResult.module, 'getDataToRender')
            // @ts-ignore
            .mockImplementation((url, params, router) => {
                if (url === requestPath) {
                    return { url };
                }

                return getDataToRenderOriginal?.(url, params, router);
            });

        const dataToRender: Promise<unknown> = new DataToRender().get(
            loadResult.module,
            requestPath,
            moduleName,
            { ...fakeRenderOptions, Router }
        );

        // Должен быть вызван метод получения данных
        expect(getDataToRenderStub).toHaveBeenCalledTimes(1);
        expect(getDataToRenderStub).toHaveBeenCalledWith(
            requestPath,
            expect.objectContaining({ prerender: false }),
            Router
        );
        expect(dataToRender).toBeInstanceOf(Promise);

        return dataToRender.then((data: unknown) => {
            expect(data).toMatchObject({ url: requestPath });
        });
    });

    it('вызов статичного метода getDataToRender из default', async () => {
        // обнулим методы getDataToRender, как будто их нет
        jest.spyOn(IndexModule, 'getDataToRender');
        // @ts-ignore
        delete IndexModule.getDataToRender;

        const loadResult: IModuleFound = {
            loadStatus: 'success',
            module: IndexModule,
        };
        const getDataToRenderOriginal = loadResult.module.default.getDataToRender?.bind(
            loadResult.module
        );

        // заглушка метода getDataToRender, чтобы он возвращал что нужно
        const getDataToRenderStub = jest
            .spyOn(loadResult.module.default, 'getDataToRender')
            // @ts-ignore
            .mockImplementation((url, params, router) => {
                if (url === requestPath) {
                    return { url };
                }

                return getDataToRenderOriginal?.(url);
            });

        const dataToRender: Promise<unknown> = new DataToRender().get(
            loadResult.module,
            requestPath,
            moduleName,
            { ...fakeRenderOptions, Router }
        );

        // Должен быть вызван метод получения данных
        expect(getDataToRenderStub).toHaveBeenCalledTimes(1);
        expect(getDataToRenderStub).toHaveBeenCalledWith(
            requestPath,
            expect.objectContaining({ prerender: false }),
            Router
        );
        expect(dataToRender).toBeInstanceOf(Promise);

        return dataToRender.then((data: unknown) => {
            expect(data).toMatchObject({ url: requestPath });
        });
    });

    it('у модуля нет метода getDataToRender', async () => {
        // обнулим методы getDataToRender, как будто их нет
        jest.spyOn(IndexModule, 'getDataToRender');
        // @ts-ignore
        delete IndexModule.getDataToRender;

        jest.spyOn(IndexModule.default, 'getDataToRender');
        // @ts-ignore
        delete IndexModule.default.getDataToRender;

        const loadResult: IModuleFound = {
            loadStatus: 'success',
            module: IndexModule,
        };

        const dataToRender: Promise<IDataToRenderNotExist | unknown> = new DataToRender().get(
            loadResult.module,
            requestPath,
            moduleName,
            { ...fakeRenderOptions, Router }
        );

        expect(dataToRender).toBeInstanceOf(Promise);

        return dataToRender.then((data: IDataToRenderNotExist | unknown) => {
            expect(data).toMatchObject({ getDataToRender: false });
        });
    });
});
