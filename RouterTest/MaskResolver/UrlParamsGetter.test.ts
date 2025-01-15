import { UrlParts } from 'Router/_private/MaskResolver/UrlParts';
import {
    UrlParamsGetter,
    PathParams,
    QueryParams,
} from 'Router/_private/MaskResolver/UrlParamsGetter';

describe('Router/_private/MaskResolver/UrlParamsGetter', () => {
    describe('UrlParamsGetter', () => {
        it('simple url', () => {
            const params = new UrlParamsGetter(
                'param/:valueId',
                '/path/param/value'
            ).get();
            expect(params.valueId).toEqual('value');
        });
        it('query url', () => {
            const params = new UrlParamsGetter(
                'param=:valueId',
                '/path/?param=value'
            ).get();
            expect(params.valueId).toEqual('value');
        });
        it('path fragment url', () => {
            const params = new UrlParamsGetter(
                'param/:valueId',
                '/path/#param/value'
            ).get();
            expect(params.valueId).toEqual('value');
        });
        it('query fragment url', () => {
            const params = new UrlParamsGetter(
                '#param=:valueId',
                '/path/#param=value'
            ).get();
            expect(params.valueId).toEqual('value');
        });
        it('simple *traverse', () => {
            const params = new UrlParamsGetter(
                'path/*traverse',
                '/path/some/tail'
            ).get();
            expect(params.traverse).toEqual('some/tail');
        });
        it('simple *traverse (1)', () => {
            const params = new UrlParamsGetter(
                'some/*traverse',
                '/path/some/tail'
            ).get();
            expect(params.traverse).toEqual('tail');
        });
        it('root *traverse', () => {
            const params = new UrlParamsGetter(
                '/*traverse',
                '/path/some/tail'
            ).get();
            expect(params.traverse).toEqual('path/some/tail');
        });
        it('root *traverse (1)', () => {
            const params = new UrlParamsGetter(
                '/*traverse',
                '/'
            ).get();
            expect(params.traverse).toEqual('');
        });
        it('complicated *traverse', () => {
            const params = new UrlParamsGetter(
                'param/:valueId/*traverse',
                '/path/param/value/some/tail'
            ).get();
            expect(params.valueId).toEqual('value');
            expect(params.traverse).toEqual('some/tail');
        });
        it('complicated *traverse (1)', () => {
            const params = new UrlParamsGetter(
                'param/:valueId/param1/:valueId1/*traverse',
                '/path/param1/value1/param/value/some/tail'
            ).get();
            expect(params.valueId).toEqual('value');
            expect(params.valueId1).toEqual('value1');
            expect(params.traverse).toEqual('some/tail');
        });
    });
    describe('PathParams', () => {
        it('simple url', () => {
            const urlParts = new UrlParts('/path/param/value');
            const params = PathParams.calculateParams(
                'param/:valueId',
                urlParts.getPath()
            );
            expect(params[0].maskId).toEqual('valueId');
            expect(params[0].urlValue).toEqual('value');
            expect(params[0].urlId).toEqual('param');
        });
        it('complicated mask', () => {
            const params = PathParams.calculateParams(
                'path/:pathId/param/:valueId',
                '/path/param/value'
            );
            const expected = [
                { maskId: 'pathId', urlValue: 'param', urlId: 'path' },
                { maskId: 'valueId', urlValue: undefined, urlId: 'param' },
            ];
            expect(params).toEqual(expected);
        });
        it('fragment url', () => {
            const urlParts = new UrlParts('/path/#param/value');
            const params = PathParams.calculateParams(
                'param/:valueId',
                urlParts.getFragment()
            );
            expect(params[0].maskId).toEqual('valueId');
            expect(params[0].urlValue).toEqual('value');
            expect(params[0].urlId).toEqual('param');
        });
        it('simple *traverse', () => {
            const urlParts = new UrlParts('/path/some/tail');
            const params = PathParams.calculateParams(
                'path/*traverse',
                urlParts.getPath()
            );
            expect(params[0].maskId).toEqual('traverse');
            expect(params[0].urlValue).toEqual('some/tail');
            expect(params[0].urlId).toBeUndefined();
        });
        it('complicated *traverse', () => {
            const urlParts = new UrlParts('/path/param/value/some/tail');
            const params = PathParams.calculateParams(
                'param/:valueId/*traverse',
                urlParts.getPath()
            );
            expect(params[0].maskId).toEqual('valueId');
            expect(params[0].urlValue).toEqual('value');
            expect(params[0].urlId).toEqual('param');

            expect(params[1].maskId).toEqual('traverse');
            expect(params[1].urlValue).toEqual('some/tail');
            expect(params[1].urlId).toBeUndefined();
        });
    });
    describe('QueryParams', () => {
        it('simple url', () => {
            const urlParts = new UrlParts('/path/?param=value');
            const params = QueryParams.createQueryObject().calculateParams(
                'param=:valueId',
                urlParts.getQuery()
            );
            expect(params[0].maskId).toEqual('valueId');
            expect(params[0].urlValue).toEqual('value');
            expect(params[0].urlId).toEqual('param');
        });
        it('fragment url', () => {
            const urlParts = new UrlParts('/path/#param=value');
            const params = QueryParams.createFragmentObject().calculateParams(
                'param=:valueId',
                urlParts.getFragment()
            );
            expect(params[0].maskId).toEqual('valueId');
            expect(params[0].urlValue).toEqual('value');
            expect(params[0].urlId).toEqual('param');
        });
    });
});
