import { logger } from 'Application/Env';
import { StateReceiver } from 'Application/State';
import * as Builder from 'Router/Builder';
import { PageSource } from 'Router/_ServerRouting/PageSource';
import {
    IPageSourceDataOK,
    IPageSourceDataNotOK,
} from 'Router/_ServerRouting/Interfaces/IPageSourceData';
import { PageSourceStatus } from 'Router/_ServerRouting/Interfaces/IPageSource';
import { fakeRenderOptions } from 'RouterTest/ServerRouting/FakeRenderData';

jest.useFakeTimers();

describe('Router/_ServerRouting/PageSource', () => {
    beforeEach(() => {
        jest.spyOn(logger, 'info').mockImplementation();
        jest.spyOn(StateReceiver.prototype, 'serialize').mockImplementation(
            () => {
                return { serialized: 'receivedStates', additionalDeps: {} };
            }
        );
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('построение несуществующего модуля', () => {
        const renderData: IPageSourceDataNotOK = {
            hasData: false,
            notFound: {
                status: PageSourceStatus.NOT_FOUND,
                error: new Error(),
            },
        };
        const onSuccessHandler = jest.fn();
        const onNotFoundHandler = jest.fn();

        return new PageSource()
            .render(
                fakeRenderOptions,
                renderData,
                onSuccessHandler,
                onNotFoundHandler
            )
            .then((pageSource) => {
                expect(onSuccessHandler).not.toHaveBeenCalled();
                expect(onNotFoundHandler).toHaveBeenCalled();
                ['status', 'error'].forEach((prop) => {
                    return expect(pageSource).toHaveProperty(prop);
                });
            });
    });

    it('успешное построение страницы', () => {
        const mainRenderSpy = jest.spyOn(Builder, 'mainRender');
        const renderData: IPageSourceDataOK = {
            hasData: true,
            dataToRender: Promise.resolve({ data: 'data' }),
            moduleName: 'RouterTest/Index',
        };
        const onSuccessHandler = jest.fn();
        const onNotFoundHandler = jest.fn();

        return new PageSource()
            .render(
                fakeRenderOptions,
                renderData,
                onSuccessHandler,
                onNotFoundHandler
            )
            .then((pageSource) => {
                expect(onSuccessHandler).toHaveBeenCalled();
                expect(onNotFoundHandler).not.toHaveBeenCalled();
                ['status', 'html'].forEach((prop) => {
                    return expect(pageSource).toHaveProperty(prop);
                });
                expect(mainRenderSpy.mock.calls[0][1]).toHaveProperty(
                    'pageConfig',
                    { data: 'data' }
                );
            });
    });

    // it('значение опции sbisIsAdaptive не меняется, если она есть в результате getDataToRender', () => {
    //     const mainRenderSpy = jest.spyOn(Builder, 'mainRender');
    //     const renderData: IPageSourceDataOK = {
    //         hasData: true,
    //         dataToRender: Promise.resolve({ sbisIsAdaptive: 'TEST' }),
    //         moduleName: 'RouterTest/Index',
    //     };
    //     const onSuccessHandler = jest.fn();
    //     const onNotFoundHandler = jest.fn();
    //
    //     return new PageSource()
    //         .render(
    //             fakeRenderOptions,
    //             renderData,
    //             onSuccessHandler,
    //             onNotFoundHandler
    //         )
    //         .then(() => {
    //             expect(mainRenderSpy.mock.calls[0][1]).toHaveProperty(
    //                 'sbisIsAdaptive',
    //                 'TEST'
    //             );
    //         });
    // });

    // it('выставление опции sbisIsAdaptive, если его нет в результате getDataToRender', () => {
    //     const mainRenderSpy = jest.spyOn(Builder, 'mainRender');
    //     const renderData: IPageSourceDataOK = {
    //         hasData: true,
    //         dataToRender: Promise.resolve({}),
    //         moduleName: 'RouterTest/Index',
    //     };
    //     const onSuccessHandler = jest.fn();
    //     const onNotFoundHandler = jest.fn();
    //
    //     return new PageSource()
    //         .render(
    //             fakeRenderOptions,
    //             renderData,
    //             onSuccessHandler,
    //             onNotFoundHandler
    //         )
    //         .then(() => {
    //             expect(mainRenderSpy.mock.calls[0][1]).toHaveProperty(
    //                 'sbisIsAdaptive',
    //                 false
    //             );
    //         });
    // });
});
