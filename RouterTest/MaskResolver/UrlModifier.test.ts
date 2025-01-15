/**
 * Здесь описаны только основные тесты. Более тщательные тесты описаны в модуле \RouterTest\MaskResolver.test.js
 */
import {
    UrlModifier,
    UrlQueryModifier,
} from 'Router/_private/MaskResolver/UrlModifier';

describe('Router/_private/MaskResolver/UrlModifier', () => {
    describe('singleparam path url', () => {
        it('add value', () => {
            let modifier = new UrlModifier(
                'param/:valueId',
                { valueId: 'newvalue' },
                '/'
            );
            expect(modifier.modify()).toEqual('/param/newvalue');
            modifier = new UrlModifier(
                'param/:valueId',
                { valueId: 'newvalue' },
                '/path/'
            );
            expect(modifier.modify()).toEqual('/path/param/newvalue/');
        });
        it('add complicated value', () => {
            const modifier = new UrlModifier(
                'update/:page',
                { page: 'updates' },
                '/update/'
            );
            expect(modifier.modify()).toEqual('/update/updates/');
        });
        it('change value', () => {
            let modifier = new UrlModifier(
                'param/:valueId',
                { valueId: 'newvalue' },
                '/param/value/'
            );
            expect(modifier.modify()).toEqual('/param/newvalue/');
            modifier = new UrlModifier(
                'path/param/:valueId',
                { valueId: 'newvalue' },
                '/path/old/'
            );
            expect(modifier.modify()).toEqual('/path/param/newvalue/');
            modifier = new UrlModifier(
                'path/param/:valueId/second/:svalueId',
                { valueId: 'newvalue' },
                '/path/old/second/sold'
            );
            expect(modifier.modify()).toEqual('/path/param/newvalue');
        });
        it('change complicated value', () => {
            let modifier = new UrlModifier(
                '/pbx-admin/:valueId',
                { valueId: 'server' },
                '/pbx-admin/pbx'
            );
            expect(modifier.modify()).toEqual('/pbx-admin/server');
            modifier = new UrlModifier(
                'tab/:tab',
                { tab: 'employee-stats' },
                '/OnlineSbisRu/money/expense-reports/tab/expense-reports/'
            );
            expect(modifier.modify()).toEqual(
                '/OnlineSbisRu/money/expense-reports/tab/employee-stats/'
            );

            // лидирующий слеш
            modifier = new UrlModifier(
                '/group/:groupId/page/:pageId',
                { pageId: 'new-page' },
                '/page/business-groups'
            );
            expect(modifier.modify()).toEqual('/page/new-page');
            modifier = new UrlModifier(
                '/group/:groupId/page/:pageId',
                { pageId: 'new-page' },
                '/page/groups'
            );
            expect(modifier.modify()).toEqual('/page/new-page');
            // без лидирующего слеша
            modifier = new UrlModifier(
                'group/:groupId/page/:pageId',
                { pageId: 'new-page' },
                '/page/business-groups'
            );
            expect(modifier.modify()).toEqual('/page/new-page');
            modifier = new UrlModifier(
                'group/:groupId/page/:pageId',
                { pageId: 'new-page' },
                '/page/groups'
            );
            expect(modifier.modify()).toEqual('/page/new-page');

            modifier = new UrlModifier(
                'tab/:tab',
                { tab: 'newtab' },
                '/path/tab/oldtab/tab/'
            );
            expect(modifier.modify()).toEqual('/path/tab/newtab/tab/');
        });
        it('add value and change value', () => {
            const modifier = new UrlModifier(
                'param/:valueId/second/:sId',
                { valueId: 'newvalue', sId: 'svalue' },
                '/path/param/value/'
            );
            expect(modifier.modify()).toEqual(
                '/path/param/newvalue/second/svalue/'
            );
        });
        it('remove value', () => {
            let modifier = new UrlModifier(
                'param/:valueId',
                {},
                '/path/param/value'
            );
            expect(modifier.modify()).toEqual('/path');
            modifier = new UrlModifier(
                'param/:valueId',
                {},
                '/path/param/value/second/svalue/'
            );
            expect(modifier.modify()).toEqual('/path/second/svalue/');
        });
        it('remove complicated value', () => {
            const modifier = new UrlModifier('update/:page', {}, '/update/');
            expect(modifier.modify()).toEqual('/');
        });
        it('replace url', () => {
            let modifier = new UrlModifier('/', {}, '/path/param/value');
            expect(modifier.modify()).toEqual('/');
            modifier = new UrlModifier(
                '/newpath/:valueId',
                { valueId: 'value' },
                '/path/param/value'
            );
            expect(modifier.modify()).toEqual('/newpath/value');
            modifier = new UrlModifier(
                '/:location',
                { location: 'website' },
                '/path/param/value?test=value'
            );
            expect(modifier.modify()).toEqual('/website');
            modifier = new UrlModifier(
                '/update/:page',
                { page: 'updates' },
                '/update/'
            );
            expect(modifier.modify()).toEqual('/update/updates/');
        });
        it('path with file extension', () => {
            let modifier = new UrlModifier(
                'page/:pageId',
                { pageId: 'new.html' },
                '/page/old.html'
            );
            expect(modifier.modify()).toEqual('/page/new.html');
            modifier = new UrlModifier(
                'page/:pageId',
                { pageId: 'new.html' },
                '/page/old/'
            );
            expect(modifier.modify()).toEqual('/page/new.html');
            modifier = new UrlModifier(
                'page/:pageId?query=:queryId',
                { pageId: 'new.html', queryId: 'qvalue' },
                '/page/old/'
            );
            expect(modifier.modify()).toEqual('/page/new.html?query=qvalue');
        });
        it('mask with trailing slash', () => {
            const modifier = new UrlModifier(
                '/update/',
                { trailingSlash: true },
                '/'
            );
            expect(modifier.modify()).toEqual('/update/');
        });
    });

    describe('multiparam path url', () => {
        it('add value', () => {
            const modifier = new UrlModifier(
                'param/:valueId/:svalueId',
                { valueId: 'newvalue', svalueId: 'snewvalue' },
                '/path/param/value/'
            );
            expect(modifier.modify()).toEqual(
                '/path/param/newvalue/snewvalue/'
            );
        });
        it('change value', () => {
            const modifier = new UrlModifier(
                'param/:valueId/:svalueId',
                { valueId: 'newvalue', svalueId: 'snewvalue' },
                '/param/value/svalue/'
            );
            expect(modifier.modify()).toEqual('/param/newvalue/snewvalue/');
        });
        it('add value and change value', () => {
            const modifier = new UrlModifier(
                'param/:valueId/:svalueId/second/:sId',
                { valueId: 'newvalue', svalueId: 'snewvalue', sId: 'svalue' },
                '/path/param/value/'
            );
            expect(modifier.modify()).toEqual(
                '/path/param/newvalue/snewvalue/second/svalue/'
            );
        });
        it('remove value', () => {
            let modifier = new UrlModifier(
                'param/:valueId/:svalueId',
                { valueId: 'newvalue' },
                '/param/value/svalue/'
            );
            expect(modifier.modify()).toEqual('/param/newvalue/');
            modifier = new UrlModifier(
                'param/:valueId/:svalueId',
                {},
                '/path/param/value/svalue/'
            );
            expect(modifier.modify()).toEqual('/path/');
        });
        it('replace url', () => {
            const modifier = new UrlModifier(
                '/newpath/:valueId/:svalueId',
                { valueId: 'newvalue', svalueId: 'snewvalue' },
                '/param/value/svalue'
            );
            expect(modifier.modify()).toEqual('/newpath/newvalue/snewvalue');
        });
    });

    describe('query url', () => {
        it('add value', () => {
            let modifier = new UrlModifier(
                'param=:valueId',
                { valueId: 'newvalue' },
                '/'
            );
            expect(modifier.modify()).toEqual('/?param=newvalue');
            modifier = new UrlModifier(
                'param=:valueId',
                { valueId: 'newvalue' },
                '/path/'
            );
            expect(modifier.modify()).toEqual('/path/?param=newvalue');
        });
        it('change value', () => {
            const modifier = new UrlModifier(
                'param=:valueId',
                { valueId: 'newvalue' },
                '/?param=value'
            );
            expect(modifier.modify()).toEqual('/?param=newvalue');
        });
        it('add value and change value', () => {
            const modifier = new UrlModifier(
                'param=:valueId&second=:sId',
                { valueId: 'newvalue', sId: 'svalue' },
                '/path/?param=value'
            );
            expect(modifier.modify()).toEqual(
                '/path/?param=newvalue&second=svalue'
            );
        });
        it('remove an existing value', () => {
            let modifier = new UrlModifier(
                'param=:valueId',
                {},
                '/path/?param=value'
            );
            expect(modifier.modify()).toEqual('/path/');
            modifier = new UrlModifier(
                'param=:valueId',
                {},
                '/path/?param=value&second=svalue'
            );
            expect(modifier.modify()).toEqual('/path/?second=svalue');
            // проверка удаления несуществующего параметра, но в текущем url есть параметр с двоеточием в значении
            modifier = new UrlModifier(
                'tab=:tab',
                { clear: true },
                '/auth/?rel=http://pre-test-online.sbis.ru/events'
            );
            expect(modifier.modify()).toEqual(
                '/auth/?rel=http://pre-test-online.sbis.ru/events'
            );
        });
        it('replace url', () => {
            const modifier = new UrlModifier(
                'newpath=:valueId',
                { valueId: 'value', replace: true },
                '/path/?param=value'
            );
            expect(modifier.modify()).toEqual('/?newpath=value');
        });
    });

    describe('singleparam path fragment url', () => {
        it('add value', () => {
            let modifier = new UrlModifier(
                '#param/:valueId',
                { valueId: 'newvalue' },
                '/'
            );
            expect(modifier.modify()).toEqual('/#param/newvalue');
            modifier = new UrlModifier(
                '#param/:valueId',
                { valueId: 'newvalue' },
                '/path/'
            );
            expect(modifier.modify()).toEqual('/path/#param/newvalue');
        });
        it('change value', () => {
            const modifier = new UrlModifier(
                'param/:valueId',
                { valueId: 'newvalue' },
                '/#param/value'
            );
            expect(modifier.modify()).toEqual('/#param/newvalue');
        });
        it('add value and change value', () => {
            const modifier = new UrlModifier(
                'param/:valueId/second/:sId',
                { valueId: 'newvalue', sId: 'svalue' },
                '/path/#param/value'
            );
            expect(modifier.modify()).toEqual(
                '/path/#param/newvalue/second/svalue'
            );
        });
        it('remove value', () => {
            let modifier = new UrlModifier(
                'param/:valueId',
                {},
                '/path/#param/value'
            );
            expect(modifier.modify()).toEqual('/path/');
            modifier = new UrlModifier(
                'param/:valueId',
                {},
                '/path/#param/value/second/svalue'
            );
            expect(modifier.modify()).toEqual('/path/#second/svalue');
        });
        it('replace url', () => {
            const modifier = new UrlModifier(
                '#newpath/:valueId',
                { valueId: 'value', replace: true },
                '/path/param/value'
            );
            expect(modifier.modify()).toEqual('/#newpath/value');
        });
    });

    describe('multiparam path fragment url', () => {
        it('add value', () => {
            const modifier = new UrlModifier(
                'param/:valueId/:svalueId',
                { valueId: 'newvalue', svalueId: 'snewvalue' },
                '/path/#param/value'
            );
            expect(modifier.modify()).toEqual(
                '/path/#param/newvalue/snewvalue'
            );
        });
        it('change value', () => {
            const modifier = new UrlModifier(
                'param/:valueId/:svalueId',
                { valueId: 'newvalue', svalueId: 'snewvalue' },
                '/#param/value/svalue'
            );
            expect(modifier.modify()).toEqual('/#param/newvalue/snewvalue');
        });
        it('add value and change value', () => {
            const modifier = new UrlModifier(
                'param/:valueId/:svalueId/second/:sId',
                { valueId: 'newvalue', svalueId: 'snewvalue', sId: 'svalue' },
                '/path/#param/value'
            );
            expect(modifier.modify()).toEqual(
                '/path/#param/newvalue/snewvalue/second/svalue'
            );
        });
        it('remove value', () => {
            let modifier = new UrlModifier(
                'param/:valueId/:svalueId',
                { valueId: 'newvalue' },
                '/#param/value/svalue'
            );
            expect(modifier.modify()).toEqual('/#param/newvalue');
            modifier = new UrlModifier(
                'param/:valueId/:svalueId',
                {},
                '/path/#param/value/svalue'
            );
            expect(modifier.modify()).toEqual('/path/');
        });
        it('replace url', () => {
            const modifier = new UrlModifier(
                '#newpath/:valueId/:svalueId',
                { valueId: 'newvalue', svalueId: 'snewvalue', replace: true },
                '/param/#value/svalue'
            );
            expect(modifier.modify()).toEqual('/#newpath/newvalue/snewvalue');
        });
    });

    describe('query fragment url', () => {
        it('add value', () => {
            let modifier = new UrlModifier(
                '#param=:valueId',
                { valueId: 'newvalue' },
                '/'
            );
            expect(modifier.modify()).toEqual('/#param=newvalue');
            modifier = new UrlModifier(
                '#param=:valueId',
                { valueId: 'newvalue' },
                '/path/'
            );
            expect(modifier.modify()).toEqual('/path/#param=newvalue');
        });
        it('change value', () => {
            const modifier = new UrlModifier(
                '#param=:valueId',
                { valueId: 'newvalue' },
                '/#param=value'
            );
            expect(modifier.modify()).toEqual('/#param=newvalue');
        });
        it('add value and change value', () => {
            const modifier = new UrlModifier(
                '#param=:valueId&second=:sId',
                { valueId: 'newvalue', sId: 'svalue' },
                '/path/#param=value'
            );
            expect(modifier.modify()).toEqual(
                '/path/#param=newvalue&second=svalue'
            );
        });
        it('remove value', () => {
            let modifier = new UrlModifier(
                '#param=:valueId',
                {},
                '/path/#param=value'
            );
            expect(modifier.modify()).toEqual('/path/');
            modifier = new UrlModifier(
                '#param=:valueId',
                {},
                '/path/#param=value&second=svalue'
            );
            expect(modifier.modify()).toEqual('/path/#second=svalue');
        });
        it('replace url', () => {
            const modifier = new UrlModifier(
                '#newpath=:valueId',
                { valueId: 'value', replace: true },
                '/path/#param=value'
            );
            expect(modifier.modify()).toEqual('/#newpath=value');
        });
    });

    describe('complicated mask', () => {
        describe('path + query', () => {
            it('add value', () => {
                let modifier = new UrlModifier(
                    'second/:svalue?query=:qvalue',
                    { svalue: 'newvalue', qvalue: 'newquery' },
                    '/path/param/pvalue'
                );
                expect(modifier.modify()).toEqual(
                    '/path/param/pvalue/second/newvalue?query=newquery'
                );
                modifier = new UrlModifier(
                    'second/:svalue?query=:qvalue',
                    { svalue: 'newvalue', qvalue: 'newquery' },
                    '/path?oldQuery=value'
                );
                expect(modifier.modify()).toEqual(
                    '/path/second/newvalue?oldQuery=value&query=newquery'
                );
            });
            it('change value', () => {
                const modifier = new UrlModifier(
                    'shop/:guid/tab/:tab?mode=:mode',
                    { guid: 'pamagiti', tab: 'about', mode: 'edit' },
                    '/shop/pamagiti/tab/about?mode=edit'
                );
                expect(modifier.modify()).toEqual(
                    '/shop/pamagiti/tab/about?mode=edit'
                );
            });
            it('add value and change value', () => {
                const modifier = new UrlModifier(
                    'second/:svalue?query=:qvalue&oldQuery=:oldQvalue',
                    {
                        svalue: 'newvalue',
                        qvalue: 'value',
                        oldQvalue: 'newQvalue',
                    },
                    '/path?oldQuery=value'
                );
                expect(modifier.modify()).toEqual(
                    '/path/second/newvalue?oldQuery=newQvalue&query=value'
                );
            });
            it('remove value | remove & change value', () => {
                let modifier = new UrlModifier(
                    'param/:pvalue?query=:qvalue',
                    {},
                    '/path/param/value?query=value'
                );
                expect(modifier.modify()).toEqual('/path');
                modifier = new UrlModifier(
                    'param/:pvalue?query=:qvalue',
                    { pvalue: 'value' },
                    '/path/param/value?query=qvalue'
                );
                expect(modifier.modify()).toEqual('/path/param/value');
            });
            it('replace url', () => {
                const modifier = new UrlModifier(
                    '/param/:pvalue/second/:svalue?query=:qvalue',
                    { pvalue: 'value', svalue: 'newvalue', qvalue: 'qvalue' },
                    '/path/first/fvalue#fragment=value'
                );
                expect(modifier.modify()).toEqual(
                    '/param/value/second/newvalue?query=qvalue'
                );
            });
            it('mask without trailing slash', () => {
                const modifier = new UrlModifier(
                    '/update?query=:val',
                    { val: 'value' },
                    '/'
                );
                expect(modifier.modify()).toEqual('/update?query=value');
            });
            it('mask with trailing slash', () => {
                const modifier = new UrlModifier(
                    '/update/?query=:val',
                    { val: 'value', trailingSlash: true },
                    '/'
                );
                expect(modifier.modify()).toEqual('/update/?query=value');
            });
        });
        describe('path + query fragment', () => {
            it('add value', () => {
                let modifier = new UrlModifier(
                    'second/:svalue#fragment=:fvalue',
                    { svalue: 'newvalue', fvalue: 'newfragment' },
                    '/path/param/pvalue'
                );
                expect(modifier.modify()).toEqual(
                    '/path/param/pvalue/second/newvalue#fragment=newfragment'
                );
                modifier = new UrlModifier(
                    'second/:svalue#fragment=:fvalue',
                    { svalue: 'newvalue', fvalue: 'newfragment' },
                    '/path#oldFragment=value'
                );
                expect(modifier.modify()).toEqual(
                    '/path/second/newvalue#oldFragment=value&fragment=newfragment'
                );
            });
            it('change value', () => {
                const modifier = new UrlModifier(
                    'param/:pvalue/tab/:tab#mode=:mode',
                    { pvalue: 'pvalue', tab: 'about', mode: 'edit' },
                    '/param/pvalue/tab/about#mode=delete'
                );
                expect(modifier.modify()).toEqual(
                    '/param/pvalue/tab/about#mode=edit'
                );
            });
            it('add value and change value', () => {
                const modifier = new UrlModifier(
                    'second/:svalue#fragment=:fvalue&oldFragment=:oldFvalue',
                    {
                        svalue: 'newvalue',
                        fvalue: 'value',
                        oldFvalue: 'newFvalue',
                    },
                    '/path#oldFragment=value'
                );
                expect(modifier.modify()).toEqual(
                    '/path/second/newvalue#oldFragment=newFvalue&fragment=value'
                );
            });
            it('remove value | remove & change value', () => {
                let modifier = new UrlModifier(
                    'param/:pvalue#fragment=:fvalue',
                    {},
                    '/path/param/value#fragment=value'
                );
                expect(modifier.modify()).toEqual('/path');
                modifier = new UrlModifier(
                    'param/:pvalue#fragment=:fvalue',
                    { fvalue: 'value' },
                    '/path/param/value#fragment=fvalue'
                );
                expect(modifier.modify()).toEqual('/path#fragment=value');
            });
            it('replace url', () => {
                const modifier = new UrlModifier(
                    '/param/:pvalue/second/:svalue#fragment=:fvalue',
                    { pvalue: 'value', svalue: 'newvalue', fvalue: 'fvalue' },
                    '/path/first/fvalue#fragment=value'
                );
                expect(modifier.modify()).toEqual(
                    '/param/value/second/newvalue#fragment=fvalue'
                );
            });
            it('mask without trailing slash', () => {
                const modifier = new UrlModifier(
                    '/update#fragment=:val',
                    { val: 'value' },
                    '/'
                );
                expect(modifier.modify()).toEqual('/update#fragment=value');
            });
            it('mask with trailing slash', () => {
                const modifier = new UrlModifier(
                    '/update/#fragment=:val',
                    { val: 'value', trailingSlash: true },
                    '/'
                );
                expect(modifier.modify()).toEqual('/update/#fragment=value');
            });
        });
        describe('query + path fragment', () => {
            it('add value', () => {
                let modifier = new UrlModifier(
                    'query=:qvalue#fragment/:fvalue',
                    { qvalue: 'newvalue', fvalue: 'newfragment' },
                    '/path/'
                );
                expect(modifier.modify()).toEqual(
                    '/path/?query=newvalue#fragment/newfragment'
                );
                modifier = new UrlModifier(
                    'query=:qvalue#fragment/:fvalue',
                    { qvalue: 'newvalue', fvalue: 'newfragment' },
                    '/path#oldFragment/value'
                );
                expect(modifier.modify()).toEqual(
                    '/path?query=newvalue#oldFragment/value/fragment/newfragment'
                );
            });
            it('change value', () => {
                const modifier = new UrlModifier(
                    'query=:qvalue&tab=:tab#mode/:mode',
                    { qvalue: 'qvalue', tab: 'about', mode: 'edit' },
                    '/?query=qvalue&tab=about#mode/delete'
                );
                expect(modifier.modify()).toEqual(
                    '/?query=qvalue&tab=about#mode/edit'
                );
            });
            it('add value and change value', () => {
                const modifier = new UrlModifier(
                    'query=:qvalue#fragment/:fvalue/oldFragment/:oldFvalue',
                    {
                        qvalue: 'newvalue',
                        fvalue: 'value',
                        oldFvalue: 'newFvalue',
                    },
                    '/path#oldFragment/value'
                );
                expect(modifier.modify()).toEqual(
                    '/path?query=newvalue#oldFragment/newFvalue/fragment/value'
                );
            });
            it('remove value | remove & change value', () => {
                let modifier = new UrlModifier(
                    'query=:qvalue#fragment/:fvalue',
                    {},
                    '/path/?query=value#fragment/value'
                );
                expect(modifier.modify()).toEqual('/path/');
                modifier = new UrlModifier(
                    'query=:qvalue#fragment/:fvalue',
                    { qvalue: 'value' },
                    '/path/?query=value#fragment/fvalue'
                );
                expect(modifier.modify()).toEqual('/path/?query=value');
            });
            it('replace url', () => {
                const modifier = new UrlModifier(
                    '/?query=:qvalue&second=:svalue#fragment/:fvalue',
                    { qvalue: 'value', svalue: 'newvalue', fvalue: 'fvalue' },
                    '/path/?first=fvalue#fragment/value'
                );
                expect(modifier.modify()).toEqual(
                    '/?query=value&second=newvalue#fragment/fvalue'
                );
            });
        });
    });

    // тестирование работы при передаче в качестве конфига неизменяемого объекта
    describe('immutable config properties - UrlModifier', () => {
        it('deleting "replace" option in UrlModifier', () => {
            const cfg = { valueId: 'newvalue', replace: true };
            // запрещаем удалять из конфига свойства
            Object.seal(cfg);

            const modifier = new UrlModifier(
                'param/:valueId',
                cfg,
                '/path/old'
            );
            expect(modifier.modify()).toEqual('/param/newvalue');
        });
    });
    describe('immutable config properties - UrlQueryModifier', () => {
        it('deleting "replace" option in', () => {
            const cfg = { valueId: 'newvalue', replace: true };
            // запрещаем удалять из конфига свойства
            Object.seal(cfg);

            const modifier = new UrlQueryModifier(
                cfg,
                '/path/?some=query#fragment'
            );
            expect(modifier.modify()).toEqual(
                '/path/?valueId=newvalue#fragment'
            );
        });

        it('deleting "clearFragment" option in', () => {
            const cfg = { valueId: 'newvalue', clearFragment: true };
            // запрещаем удалять из конфига свойства
            Object.seal(cfg);

            const modifier = new UrlQueryModifier(
                cfg,
                '/path/?some=query#fragment'
            );
            expect(modifier.modify()).toEqual(
                '/path/?some=query&valueId=newvalue'
            );
        });
    });
});
