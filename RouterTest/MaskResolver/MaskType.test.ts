import { IoC } from 'Env/Env';
import { UrlParts } from 'Router/_private/MaskResolver/UrlParts';
import {
    calculateMaskType,
    MaskType,
} from 'Router/_private/MaskResolver/MaskType';

describe('Router/_private/MaskResolver/MaskType', () => {
    describe('некорректная маска', () => {
        const originalLogger = IoC.resolve('ILogger');
        beforeEach(() => {
            // переопределяем логгер, чтобы при ошибке некорректной маски не упали тесты из-за сообщений логгера
            IoC.bind('ILogger', {
                warn: originalLogger.warn,
                error: () => {
                    /* */
                },
                log: originalLogger.log,
                info: originalLogger.info,
            });
        });
        afterEach(() => {
            IoC.bind('ILogger', originalLogger);
        });
        it('unknown mask', () => {
            const maskType = calculateMaskType(
                'param',
                new UrlParts('/param/pvalue')
            );
            expect(maskType.length).toEqual(1);
            expect(maskType[0].mask).toEqual('param');
            expect(maskType[0].maskType).toEqual(MaskType.Undefined);
        });
    });
    describe('path mask', () => {
        it('simple url', () => {
            const maskType = calculateMaskType(
                'param/:value',
                new UrlParts('/param/pvalue')
            );
            expect(maskType.length).toEqual(1);
            expect(maskType[0].mask).toEqual('param/:value');
            expect(maskType[0].maskType).toEqual(MaskType.Path);
        });
        it('url with fragment', () => {
            const maskType = calculateMaskType(
                'param/:value',
                new UrlParts('/param/pvalue#fragment/pvalue')
            );
            expect(maskType.length).toEqual(1);
            expect(maskType[0].mask).toEqual('param/:value');
            expect(maskType[0].maskType).toEqual(MaskType.Path);
        });
    });
    describe('query mask', () => {
        it('simple url', () => {
            const maskType = calculateMaskType(
                'param=:value',
                new UrlParts('/?param=pvalue')
            );
            expect(maskType.length).toEqual(1);
            expect(maskType[0].mask).toEqual('param=:value');
            expect(maskType[0].maskType).toEqual(MaskType.Query);
        });
        it('url with fragment', () => {
            const maskType = calculateMaskType(
                'param=:value',
                new UrlParts('/?param=pvalue#fragment=pvalue')
            );
            expect(maskType.length).toEqual(1);
            expect(maskType[0].mask).toEqual('param=:value');
            expect(maskType[0].maskType).toEqual(MaskType.Query);
        });
    });
    it('path fragment mask', () => {
        const maskType = calculateMaskType(
            'param/:value',
            new UrlParts('/path/pvalue#param/pvalue')
        );
        expect(maskType.length).toEqual(1);
        expect(maskType[0].mask).toEqual('param/:value');
        expect(maskType[0].maskType).toEqual(MaskType.PathFragment);
    });
    it('query fragment mask', () => {
        const maskType = calculateMaskType(
            '#param=:value',
            new UrlParts('/?query=qvalue#param=pvalue')
        );
        expect(maskType.length).toEqual(1);
        expect(maskType[0].mask).toEqual('#param=:value');
        expect(maskType[0].maskType).toEqual(MaskType.QueryFragment);
    });

    describe('complicated masks', () => {
        it('path + query', () => {
            const maskType = calculateMaskType(
                'path/:path?param=:value',
                new UrlParts('/path/pathValue?param=pvalue')
            );
            expect(maskType.length).toEqual(2);
            expect(maskType[0].mask).toEqual('path/:path');
            expect(maskType[0].maskType).toEqual(MaskType.Path);
            expect(maskType[1].mask).toEqual('?param=:value');
            expect(maskType[1].maskType).toEqual(MaskType.Query);
        });
        it('path + path fragment', () => {
            const maskType = calculateMaskType(
                'path/:path#fragment/:value',
                new UrlParts('/path/pathValue#fragment/fvalue')
            );
            expect(maskType.length).toEqual(2);
            expect(maskType[0].mask).toEqual('path/:path');
            expect(maskType[0].maskType).toEqual(MaskType.Path);
            expect(maskType[1].mask).toEqual('#fragment/:value');
            expect(maskType[1].maskType).toEqual(MaskType.PathFragment);
        });
        it('path + query fragment', () => {
            const maskType = calculateMaskType(
                'path/:path#fragment=:value',
                new UrlParts('/path/pathValue#fragment=fvalue')
            );
            expect(maskType.length).toEqual(2);
            expect(maskType[0].mask).toEqual('path/:path');
            expect(maskType[0].maskType).toEqual(MaskType.Path);
            expect(maskType[1].mask).toEqual('#fragment=:value');
            expect(maskType[1].maskType).toEqual(MaskType.QueryFragment);
        });
        it('query + path fragment', () => {
            const maskType = calculateMaskType(
                'query=:qvalue#fragment/:value',
                new UrlParts('/?query=qvalue#fragment/fvalue')
            );
            expect(maskType.length).toEqual(2);
            expect(maskType[0].mask).toEqual('query=:qvalue');
            expect(maskType[0].maskType).toEqual(MaskType.Query);
            expect(maskType[1].mask).toEqual('#fragment/:value');
            expect(maskType[1].maskType).toEqual(MaskType.PathFragment);
        });
        it('query + query fragment', () => {
            const maskType = calculateMaskType(
                'query=:qvalue#fragment=:value',
                new UrlParts('/?query=qvalue#fragment=fvalue')
            );
            expect(maskType.length).toEqual(2);
            expect(maskType[0].mask).toEqual('query=:qvalue');
            expect(maskType[0].maskType).toEqual(MaskType.Query);
            expect(maskType[1].mask).toEqual('#fragment=:value');
            expect(maskType[1].maskType).toEqual(MaskType.QueryFragment);
        });
        it('path + query + path fragment', () => {
            const maskType = calculateMaskType(
                'path/:path?query=:qvalue#fragment/:value',
                new UrlParts('/path/pathValue?query=qvalue#fragment/fvalue')
            );
            expect(maskType.length).toEqual(3);
            expect(maskType[0].mask).toEqual('path/:path');
            expect(maskType[0].maskType).toEqual(MaskType.Path);
            expect(maskType[1].mask).toEqual('?query=:qvalue');
            expect(maskType[1].maskType).toEqual(MaskType.Query);
            expect(maskType[2].mask).toEqual('#fragment/:value');
            expect(maskType[2].maskType).toEqual(MaskType.PathFragment);
        });
        it('path + query + query fragment', () => {
            const maskType = calculateMaskType(
                'path/:path?query=:qvalue#fragment=:value',
                new UrlParts('/path/pathValue?query=qvalue#fragment=fvalue')
            );
            expect(maskType.length).toEqual(3);
            expect(maskType[0].mask).toEqual('path/:path');
            expect(maskType[0].maskType).toEqual(MaskType.Path);
            expect(maskType[1].mask).toEqual('?query=:qvalue');
            expect(maskType[1].maskType).toEqual(MaskType.Query);
            expect(maskType[2].mask).toEqual('#fragment=:value');
            expect(maskType[2].maskType).toEqual(MaskType.QueryFragment);
        });
    });
});
