import { IoC } from 'Env/Env';
import { logger } from 'Application/Env';
import MaskResolver, { getAppNameByUrl } from 'Router/_private/MaskResolver';
import RouterUrl from 'Router/_private/Router/RouterUrl';
import WindowLocation from 'Router/_private/Router/WindowLocation';
import UrlRewriterTest from '../UrlRewriter/UrlRewriterTest';

// переопределим router.js в тестах, т.к. он подтянется из корня, а там из RouterDemo
UrlRewriterTest._createNewInstance({});

describe('Router/MaskResolver', () => {
    describe('#getAppNameByUrl', () => {
        it('returns index component name', () => {
            expect(getAppNameByUrl('/Website/Register')).toEqual('Website/Index');
        });

        it('ignores query params if they are separated by slash', () => {
            expect(getAppNameByUrl('/MainPage/?waittime=100')).toEqual('MainPage/Index');
        });

        it('ignores query params if they are NOT separated by slash', () => {
            expect(getAppNameByUrl('/ServerStatus?timeout=500')).toEqual('ServerStatus/Index');
        });

        it('ignores hash params if they are separated by slash', () => {
            expect(getAppNameByUrl('/MainPage/#waittime=100')).toEqual('MainPage/Index');
        });

        it('ignores hash params if they are NOT separated by slash', () => {
            expect(getAppNameByUrl('/MainPage#waittime=100')).toEqual('MainPage/Index');
        });

        it('allows one-part addresses', () => {
            expect(getAppNameByUrl('Booking')).toEqual('Booking/Index');
        });

        it('not throws exception and no decoding URI', () => {
            jest.spyOn(logger, 'error').mockImplementation(() => undefined);
            const wrongURI = '/Module/%E0%A4%A';
            expect(() => getAppNameByUrl(wrongURI)).not.toThrowError('URI malformed');
            expect(getAppNameByUrl(wrongURI)).toEqual('Module/Index');
        });
    });

    describe('MaskResolver class', () => {
        const _location = new WindowLocation('/path');
        _location.search = '?query=value';
        const routerUrl = new RouterUrl(_location, UrlRewriterTest.getInstance());
        const maskResolver = new MaskResolver(UrlRewriterTest.getInstance(), routerUrl);

        describe('#calculateUrlParams', () => {
            it('decodes uri components', () => {
                const mask = 'fullname/:name';
                const url = '/fullname/John%20Doe';
                const calculated = maskResolver.calculateUrlParams(mask, url);

                expect(calculated.name).toEqual('John Doe');
            });

            it('decodes encoded forward slash', () => {
                const mask = 'order/:products';
                const url = '/restaurant/order/bacon%2Flettuce%2Ftomato/time/now';
                const calculated = maskResolver.calculateUrlParams(mask, url);

                expect(calculated.products).toEqual('bacon/lettuce/tomato');
            });

            describe('one parameter with slash', () => {
                it('interprets end of url as separator', () => {
                    const mask = 'tab/:tabName';
                    const url = '/order/tab/taxi';
                    const calculated = maskResolver.calculateUrlParams(mask, url);

                    expect(calculated.tabName).toEqual('taxi');
                });

                it('interprets start of query as separator', () => {
                    const mask = 'tab/:tabName';
                    const url = '/order/tab/yacht?price=expensive';
                    const calculated = maskResolver.calculateUrlParams(mask, url);

                    expect(calculated.tabName).toEqual('yacht');
                });

                it('interprets start of hash as separator', () => {
                    const mask = 'tab/:tabName';
                    const url = '/order/tab/plane#time_spent=10h';
                    const calculated = maskResolver.calculateUrlParams(mask, url);

                    expect(calculated.tabName).toEqual('plane');
                });

                it('interprets slash as separator', () => {
                    const mask = 'tab/:tabName';
                    const url = '/order/tab/train/personal';
                    const calculated = maskResolver.calculateUrlParams(mask, url);

                    expect(calculated.tabName).toEqual('train');
                });

                // TODO Add root masks to docs
                it('recognizes root mask', () => {
                    const mask = '/tab/:tabName';
                    const url = '/tab/main/subtab/tab/signup';
                    const calculated = maskResolver.calculateUrlParams(mask, url);

                    expect(calculated.tabName).toEqual('main');
                });

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
                    // TODO Add presence masks to docs?
                    it('works with presence masks', () => {
                        const mask = 'word';
                        const url = '/tab/main/order/word/2003';

                        expect(
                            maskResolver.calculateUrlParams.bind(maskResolver, mask, url)
                        ).not.toThrow();
                    });
                });

                it('few parameters in mask', () => {
                    const mask = 'tab/:tabName/subtab/:subName';
                    const url = '/order/tab/taxi/subtab/cars';
                    const calculated = maskResolver.calculateUrlParams(mask, url);

                    expect(calculated.tabName).toEqual('taxi');
                    expect(calculated.subName).toEqual('cars');
                });

                it('few parameters in mask not in url', () => {
                    let mask = 'tab/:tabName/subtab/:subName';
                    let url = '/order/tab/taxi';
                    let calculated = maskResolver.calculateUrlParams(mask, url);
                    expect(calculated.tabName).toEqual('taxi');
                    expect(calculated.subName).toBeUndefined();

                    mask = '/group/:groupId/page/:pageId';
                    url = '/group/page/group-page-1';
                    calculated = maskResolver.calculateUrlParams(mask, url);
                    expect(calculated.groupId).toEqual('page');
                    expect(calculated.pageId).toBeUndefined();
                });
            });

            describe('one parameter with query', () => {
                it('interprets end of url as separator', () => {
                    const mask = 'param=:pvalue';
                    const url = '/path?param=value';
                    const calculated = maskResolver.calculateUrlParams(mask, url);

                    expect(calculated.pvalue).toEqual('value');
                });

                it('interprets ampersand as separator', () => {
                    const mask = 'param=:pvalue';
                    const url = '/path?param=value&otherparam=othervalue';
                    const calculated = maskResolver.calculateUrlParams(mask, url);

                    expect(calculated.pvalue).toEqual('value');
                });

                it('interprets ampersand as separator 2', () => {
                    const mask = 'param=:pvalue';
                    const url = '/path?firstparam=firstvalue&param=value&otherparam=othervalue';
                    const calculated = maskResolver.calculateUrlParams(mask, url);

                    expect(calculated.pvalue).toEqual('value');
                });

                it('interprets start of hash as separator', () => {
                    const mask = 'param=:pvalue';
                    const url = '/path?param=value#hash=true';
                    const calculated = maskResolver.calculateUrlParams(mask, url);

                    expect(calculated.pvalue).toEqual('value');
                });

                it('few parameters in mask', () => {
                    const mask = 'param=:pvalue&query=:qvalue';
                    const url = '/path?param=value&query=different';
                    const calculated = maskResolver.calculateUrlParams(mask, url);

                    expect(calculated.pvalue).toEqual('value');
                    expect(calculated.qvalue).toEqual('different');
                });

                it('few parameters in mask not in url', () => {
                    const mask = 'param=:pvalue&query=:qvalue';
                    const url = '/path?param=value';
                    const calculated = maskResolver.calculateUrlParams(mask, url);

                    expect(calculated.pvalue).toEqual('value');
                    expect(calculated.qvalue).toBeUndefined();
                });
            });

            describe('multiparameter mask', () => {
                it('reads the parameters in the correct order', () => {
                    const mask = 'page/:first/:second/:third';
                    const url = '/mysite/page/the/main/menu/notthis';
                    const calculated = maskResolver.calculateUrlParams(mask, url);

                    expect(calculated.first).toEqual('the');
                    expect(calculated.second).toEqual('main');
                    expect(calculated.third).toEqual('menu');
                });

                it('fills in the missing parameters as undefined', () => {
                    const mask = 'tab/:first/:second/:third';
                    const url = '/order/tab/train';
                    const calculated = maskResolver.calculateUrlParams(mask, url);

                    expect(calculated.first).toEqual('train');
                    expect(calculated.second).toBeUndefined();
                    expect(calculated.third).toBeUndefined();
                });

                it('recognizes root mask', () => {
                    const mask = '/page/:name/:tab';
                    const url = '/page/main/order/page/275';
                    const calculated = maskResolver.calculateUrlParams(mask, url);

                    expect(calculated.name).toEqual('main');
                    expect(calculated.tab).toEqual('order');
                });

                it('recognizes root mask and fills in the missing parameters as undefined', () => {
                    const mask = '/page/:name/:tab';
                    const url = '/page/main';
                    const calculated = maskResolver.calculateUrlParams(mask, url);

                    expect(calculated.name).toEqual('main');
                    expect(calculated.tab).toBeUndefined();
                });

                it('mask with slash at the end', () => {
                    const mask = 'tab/:page/:key/';
                    const url = '/path/tab/complect/20384325';
                    const calculated = maskResolver.calculateUrlParams(mask, url);

                    expect(calculated.page).toEqual('complect');
                    expect(calculated.key).toEqual('20384325');
                });
            });
        });

        describe('#calculateHref', () => {
            describe('simple masks', () => {
                describe('starting at root url', () => {
                    beforeEach(() => {
                        routerUrl.setStateUrl('/');
                    });
                    it('can add a new value', () => {
                        const newUrl = maskResolver.calculateHref('first/:value', {
                            value: 'fvalue',
                        });
                        expect(newUrl).toEqual('/first/fvalue');
                    });
                });
                describe('starting with simple params', () => {
                    beforeEach(() => {
                        routerUrl.setStateUrl('/first/fvalue/second/svalue/');
                    });
                    it('can change an existing value', () => {
                        const newUrl = maskResolver.calculateHref('second/:value', {
                            value: 'abc',
                        });
                        expect(newUrl).toEqual('/first/fvalue/second/abc/');
                    });
                    it('can add a new value', () => {
                        const newUrl = maskResolver.calculateHref('newval/:value', {
                            value: 'supernew',
                        });
                        expect(newUrl).toEqual('/first/fvalue/second/svalue/newval/supernew/');
                    });
                    it('can add a new value and change an existing value', () => {
                        let newUrl = maskResolver.calculateHref('first/:fvalue/newval/:value', {
                            fvalue: 'fnew',
                            value: 'supernew',
                        });
                        expect(newUrl).toEqual('/first/fnew/second/svalue/newval/supernew/');
                        // то же самое, но в маске порядок полей не как в url
                        newUrl = maskResolver.calculateHref('newval/:value/second/:svalue', {
                            value: 'supernew',
                            svalue: 'snew',
                        });
                        expect(newUrl).toEqual('/first/fvalue/second/snew/newval/supernew/');
                    });
                    it('can remove an existing value', () => {
                        const newUrl = maskResolver.calculateHref('first/:value', { clear: true });
                        expect(newUrl).toEqual('/second/svalue/');
                    });
                });
                describe('starting with query', () => {
                    beforeEach(() => {
                        routerUrl.setStateUrl('/?qfrst=fvalue&qscnd=svalue');
                    });
                    it('can add a new value', () => {
                        const newUrl = maskResolver.calculateHref('newval/:value', {
                            value: 'supernew',
                        });
                        expect(newUrl).toEqual('/newval/supernew?qfrst=fvalue&qscnd=svalue');
                    });
                });
                describe('starting with simple params and query', () => {
                    beforeEach(() => {
                        routerUrl.setStateUrl(
                            '/first/fvalue/second/svalue/?qfrst=fvalue&qscnd=svalue'
                        );
                    });
                    it('can change an existing value', () => {
                        const newUrl = maskResolver.calculateHref('second/:value', {
                            value: 'abc',
                        });
                        expect(newUrl).toEqual(
                            '/first/fvalue/second/abc/?qfrst=fvalue&qscnd=svalue'
                        );
                    });
                    it('can add a new value', () => {
                        const newUrl = maskResolver.calculateHref('newval/:value', {
                            value: 'supernew',
                        });
                        expect(newUrl).toEqual(
                            '/first/fvalue/second/svalue/newval/supernew/?qfrst=fvalue&qscnd=svalue'
                        );
                    });
                    it('can remove an existing value', () => {
                        const newUrl = maskResolver.calculateHref('first/:value', { clear: true });
                        expect(newUrl).toEqual('/second/svalue/?qfrst=fvalue&qscnd=svalue');
                    });
                    it('can replace value', () => {
                        const newUrl = maskResolver.calculateHref('/test/:value', { value: 'abc' });
                        expect(newUrl).toEqual('/test/abc/');
                    });
                });
            });

            describe('multiparam masks', () => {
                describe('starting at root url', () => {
                    beforeEach(() => {
                        routerUrl.setStateUrl('/');
                    });
                    it('can add a new value', () => {
                        const newUrl = maskResolver.calculateHref('newname/:first/:second', {
                            first: 'a',
                            second: 'b',
                        });
                        expect(newUrl).toEqual('/newname/a/b');
                    });
                });
                describe('starting with simple params', () => {
                    beforeEach(() => {
                        routerUrl.setStateUrl('/first/fvalue/second/svalue/');
                    });
                    it('can change an existing value', () => {
                        const newUrl = maskResolver.calculateHref('first/:a/:b/:c', {
                            a: 'ast',
                            b: 'bst',
                            c: 'cst',
                        });
                        expect(newUrl).toEqual('/first/ast/bst/cst/');
                    });
                    it('can add a new value', () => {
                        const newUrl = maskResolver.calculateHref('newname/:first/:second', {
                            first: 'a',
                            second: 'b',
                        });
                        expect(newUrl).toEqual('/first/fvalue/second/svalue/newname/a/b/');
                    });
                    it('can remove an existing value', () => {
                        const newUrl = maskResolver.calculateHref('first/:a/:b', { clear: true });
                        expect(newUrl).toEqual('/svalue/');
                    });
                });
                describe('starting with query', () => {
                    beforeEach(() => {
                        routerUrl.setStateUrl('/?qfrst=fvalue&qscnd=svalue');
                    });
                    it('can add a new value', () => {
                        const newUrl = maskResolver.calculateHref('newname/:first/:second', {
                            first: 'a',
                            second: 'b',
                        });
                        expect(newUrl).toEqual('/newname/a/b?qfrst=fvalue&qscnd=svalue');
                    });
                });
                describe('starting with simple params and query', () => {
                    beforeEach(() => {
                        routerUrl.setStateUrl(
                            '/first/fvalue/second/svalue/?qfrst=fvalue&qscnd=svalue'
                        );
                    });
                    it('can change an existing value', () => {
                        const newUrl = maskResolver.calculateHref('first/:a/:b/:c', {
                            a: 'ast',
                            b: 'bst',
                            c: 'cst',
                        });
                        expect(newUrl).toEqual('/first/ast/bst/cst/?qfrst=fvalue&qscnd=svalue');
                    });
                    it('can add a new value', () => {
                        const newUrl = maskResolver.calculateHref('newname/:first/:second', {
                            first: 'a',
                            second: 'b',
                        });
                        expect(newUrl).toEqual(
                            '/first/fvalue/second/svalue/newname/a/b/?qfrst=fvalue&qscnd=svalue'
                        );
                    });
                    it('can remove an existing value', () => {
                        const newUrl = maskResolver.calculateHref('first/:a/:b', { clear: true });
                        expect(newUrl).toEqual('/svalue/?qfrst=fvalue&qscnd=svalue');
                    });
                    it('can replace value', () => {
                        const newUrl = maskResolver.calculateHref('/newpath/:bv/:cv', {
                            bv: 'b',
                            cv: 35,
                        });
                        expect(newUrl).toEqual('/newpath/b/35/');
                    });
                });

                describe('query masks', () => {
                    describe('starting at root url', () => {
                        beforeEach(() => {
                            routerUrl.setStateUrl('/');
                        });
                        it('can add a new value', () => {
                            const newUrl = maskResolver.calculateHref('qfrst=:value', {
                                value: 'abc',
                            });
                            expect(newUrl).toEqual('/?qfrst=abc');
                        });
                    });
                    describe('starting with simple params', () => {
                        it('can add a new value', () => {
                            routerUrl.setStateUrl('/first/fvalue/second/svalue/');
                            const newUrl = maskResolver.calculateHref('qfrst=:value', {
                                value: 'abc',
                            });
                            expect(newUrl).toEqual('/first/fvalue/second/svalue/?qfrst=abc');
                        });
                        it('can add a new value with forward slash', () => {
                            routerUrl.setStateUrl('/first/fvalue/second/svalue');
                            const newUrl = maskResolver.calculateHref('qfrst=:value', {
                                value: 'abc',
                            });
                            expect(newUrl).toEqual('/first/fvalue/second/svalue?qfrst=abc');
                        });
                    });
                    describe('starting with query', () => {
                        beforeEach(() => {
                            routerUrl.setStateUrl('/?qfrst=fvalue&qscnd=svalue');
                        });
                        it('can change an existing value', () => {
                            const newUrl = maskResolver.calculateHref('qfrst=:value', {
                                value: 'abc',
                            });
                            expect(newUrl).toEqual('/?qfrst=abc&qscnd=svalue');
                        });

                        it('can change an existing value and add new param', () => {
                            const newUrl = maskResolver.calculateHref('qfrst=:vfrst&qthrd=:vthrd', {
                                vfrst: '',
                                vthrd: 'three',
                            });
                            expect(newUrl).toEqual('/?qfrst=&qscnd=svalue&qthrd=three');
                        });

                        it('can add a new value', () => {
                            const newUrl = maskResolver.calculateHref('qthrd=:value', {
                                value: 'abc',
                            });
                            expect(newUrl).toEqual('/?qfrst=fvalue&qscnd=svalue&qthrd=abc');
                        });
                        it('can remove an existing value', () => {
                            const newUrl = maskResolver.calculateHref('qfrst=:value', {
                                clear: true,
                            });
                            expect(newUrl).toEqual('/?qscnd=svalue');
                        });
                        it('can remove the only value', () => {
                            routerUrl.setStateUrl('/?qfrst=fvalue');
                            const newUrl = maskResolver.calculateHref('qfrst=:value', {
                                clear: true,
                            });
                            expect(newUrl).toEqual('/');
                        });
                    });
                    describe('starting with simple params and query', () => {
                        beforeEach(() => {
                            routerUrl.setStateUrl(
                                '/first/fvalue/second/svalue/?qfrst=fvalue&qscnd=svalue'
                            );
                        });
                        it('can change an existing value', () => {
                            const newUrl = maskResolver.calculateHref('qfrst=:value', {
                                value: 'abc',
                            });
                            expect(newUrl).toEqual(
                                '/first/fvalue/second/svalue/?qfrst=abc&qscnd=svalue'
                            );
                        });
                        it('can add a new value', () => {
                            const newUrl = maskResolver.calculateHref('qthrd=:value', {
                                value: 'abc',
                            });
                            expect(newUrl).toEqual(
                                '/first/fvalue/second/svalue/?qfrst=fvalue&qscnd=svalue&qthrd=abc'
                            );
                        });
                        it('can remove an existing value', () => {
                            const newUrl = maskResolver.calculateHref('qscnd=:value', {
                                clear: true,
                            });
                            expect(newUrl).toEqual('/first/fvalue/second/svalue/?qfrst=fvalue');
                        });
                    });
                });

                describe('shared cases', () => {
                    describe('simple param', () => {
                        beforeEach(() => {
                            routerUrl.setStateUrl('/first/special%20param/second/svalue');
                        });

                        it('can add encoded value', () => {
                            const newUrl = maskResolver.calculateHref('test/:value', {
                                value: 'has spaces',
                            });
                            expect(newUrl).toEqual(
                                '/first/special%20param/second/svalue/test/has%20spaces'
                            );
                        });
                        it('can change encoded value to encoded value', () => {
                            const newUrl = maskResolver.calculateHref('first/:value', {
                                value: 'has spaces',
                            });
                            expect(newUrl).toEqual('/first/has%20spaces/second/svalue');
                        });
                        it('can change encoded value to unencoded value', () => {
                            const newUrl = maskResolver.calculateHref('first/:value', {
                                value: 'simple',
                            });
                            expect(newUrl).toEqual('/first/simple/second/svalue');
                        });
                        it('can change unencoded value to encoded value', () => {
                            const newUrl = maskResolver.calculateHref('second/:value', {
                                value: 'with/slash',
                            });
                            expect(newUrl).toEqual('/first/special%20param/second/with%2Fslash');
                        });
                        it('can remove encoded value', () => {
                            const newUrl = maskResolver.calculateHref('first/:value', {
                                clear: true,
                            });
                            expect(newUrl).toEqual('/second/svalue');
                        });
                    });

                    describe('query param', () => {
                        beforeEach(() => {
                            routerUrl.setStateUrl('/?qfrst=special%20value&qscnd=svalue');
                        });

                        it('can add encoded value', () => {
                            const newUrl = maskResolver.calculateHref('qthrd=:value', {
                                value: 'mail@me',
                            });
                            expect(newUrl).toEqual(
                                '/?qfrst=special%20value&qscnd=svalue&qthrd=mail%40me'
                            );
                        });
                        it('can change encoded value to encoded value', () => {
                            const newUrl = maskResolver.calculateHref('qfrst=:value', {
                                value: 'with spaces',
                            });
                            expect(newUrl).toEqual('/?qfrst=with%20spaces&qscnd=svalue');
                        });
                        it('can change encoded value to unencoded value', () => {
                            const newUrl = maskResolver.calculateHref('qfrst=:value', {
                                value: 'simple',
                            });
                            expect(newUrl).toEqual('/?qfrst=simple&qscnd=svalue');
                        });
                        it('can change unencoded value to encoded value', () => {
                            const newUrl = maskResolver.calculateHref('qscnd=:value', {
                                value: 'my$money',
                            });
                            expect(newUrl).toEqual('/?qfrst=special%20value&qscnd=my%24money');
                        });
                        it('can remove encoded value', () => {
                            const newUrl = maskResolver.calculateHref('qfrst=:value', {
                                clear: true,
                            });
                            expect(newUrl).toEqual('/?qscnd=svalue');
                        });
                    });
                });
            });

            describe('appends to the end of url if mask has more parameters than url', () => {
                it('can append to end of url', () => {
                    routerUrl.setStateUrl('/root/page/signup');
                    const newUrl = maskResolver.calculateHref('page/:pageName/:pageParam', {
                        pageName: 'login',
                        pageParam: 'now',
                    });
                    expect(newUrl).toEqual('/root/page/login/now');
                });
                it('can append to end of main part of url if it has query params', () => {
                    routerUrl.setStateUrl('/root/page/signup?query=true');
                    const newUrl = maskResolver.calculateHref('page/:pageName/:pageParam', {
                        pageName: 'login',
                        pageParam: 'now',
                    });
                    expect(newUrl).toEqual('/root/page/login/now?query=true');
                });
                it('can append to end of main part of url if it has query params after slash', () => {
                    routerUrl.setStateUrl('/root/page/signup/?query=true');
                    const newUrl = maskResolver.calculateHref('page/:pageName/:pageParam', {
                        pageName: 'login',
                        pageParam: 'now',
                    });
                    // trailing slash doesn't matter for routing
                    expect(newUrl).toEqual('/root/page/login/now/?query=true');
                });
                it('can append to end of main part of url if it has hash', () => {
                    routerUrl.setStateUrl('/root/page/signup#hashparam');
                    const newUrl = maskResolver.calculateHref('page/:pageName/:pageParam', {
                        pageName: 'login',
                        pageParam: 'now',
                    });
                    expect(newUrl).toEqual('/root/page/login/now#hashparam');
                });
                it('can append to end of main part of url if it has hash after slash', () => {
                    routerUrl.setStateUrl('/root/page/signup/#hashparam');
                    const newUrl = maskResolver.calculateHref('page/:pageName/:pageParam', {
                        pageName: 'login',
                        pageParam: 'now',
                    });
                    expect(newUrl).toEqual('/root/page/login/now/#hashparam');
                });
            });

            describe('fragments with slash', () => {
                beforeEach(() => {
                    routerUrl.setStateUrl('/path/#first/fvalue/second/svalue');
                });
                it('can change an existing value', () => {
                    let newUrl = maskResolver.calculateHref('first/:value', {
                        value: 'abc',
                    });
                    expect(newUrl).toEqual('/path/#first/abc/second/svalue');
                    newUrl = maskResolver.calculateHref('second/:value', {
                        value: 'abc',
                    });
                    expect(newUrl).toEqual('/path/#first/fvalue/second/abc');
                });
                it('can add a new value', () => {
                    const newUrl = maskResolver.calculateHref('#newval/:value', {
                        value: 'supernew',
                    });
                    expect(newUrl).toEqual('/path/#first/fvalue/second/svalue/newval/supernew');
                });
            });

            describe('fragments with queries', () => {
                beforeEach(() => {
                    routerUrl.setStateUrl('/path/#first=fvalue&second=svalue');
                });
                it('can change an existing value', () => {
                    const newUrl = maskResolver.calculateHref('#second=:value', { value: 'abc' });
                    expect(newUrl).toEqual('/path/#first=fvalue&second=abc');
                });
            });

            /** Проверка вычисления url-адреса, когда используется корневая маска (с "/" вначале).
             * с опцией keepQuery query-часть url-адреса не должна очищаться
             */
            describe('keepQuery', () => {
                it('root url', () => {
                    routerUrl.setStateUrl('/?query=value');
                    const newUrl = maskResolver.calculateHref('/page/:pageId', {
                        pageId: 'NewName',
                        keepQuery: true,
                    });
                    expect(newUrl).toEqual('/page/NewName?query=value');
                });
                it('simple url', () => {
                    routerUrl.setStateUrl('/page/Name?query=value');
                    const newUrl = maskResolver.calculateHref('/page/:pageId', {
                        pageId: 'NewName',
                        keepQuery: true,
                    });
                    expect(newUrl).toEqual('/page/NewName?query=value');
                });
            });

            it('url with protocol', () => {
                const newUrl = maskResolver.calculateHref(
                    '?param=:param',
                    { param: 'value' },
                    'http://site'
                );
                expect(newUrl).toEqual('http://site?param=value');
            });
        });

        describe('#calculateQueryHref', () => {
            it('add param', () => {
                const newUrl = maskResolver.calculateQueryHref({ param: 'value' }, '/path');
                expect(newUrl).toEqual('/path?param=value');
            });
            it('replace params', () => {
                const newUrl = maskResolver.calculateQueryHref(
                    { param: 'newvalue' },
                    '/path?param=value'
                );
                expect(newUrl).toEqual('/path?param=newvalue');
            });
            it('replace params, url has trailing slash', () => {
                // раньше была логика, что у url с расширением в конце (напр. .html) нельзя добавлять слеш в конце.
                // из-за неточной регулярки (типа /\.[^.]+$/) ситуация с url вида /site.ru/path/ обрабатывалась некорректно
                let newUrl = maskResolver.calculateQueryHref(
                    { param: 'newvalue' },
                    '/site.ru/path/?param=value'
                );
                expect(newUrl).toEqual('/site.ru/path/?param=newvalue');

                newUrl = maskResolver.calculateQueryHref(
                    { param: 'newvalue' },
                    'http://site.ru/?param=value'
                );
                expect(newUrl).toEqual('http://site.ru/?param=newvalue');
            });
            it('clear params', () => {
                const newUrl = maskResolver.calculateQueryHref(
                    { replace: true },
                    '/path?query=value&param=value1'
                );
                expect(newUrl).toEqual('/path');
            });
            it('clear and add params', () => {
                const newUrl = maskResolver.calculateQueryHref(
                    { param: 'newvalue', replace: true },
                    '/path?query=value&param=value1'
                );
                expect(newUrl).toEqual('/path?param=newvalue');
            });
            it('clear fragment', () => {
                const newUrl = maskResolver.calculateQueryHref(
                    { clearFragment: true },
                    '/path?query=value#fragment'
                );
                expect(newUrl).toEqual('/path?query=value');
            });
            it('url with protocol', () => {
                const newUrl = maskResolver.calculateQueryHref({ param: 'value' }, 'http://site');
                expect(newUrl).toEqual('http://site?param=value');
            });
        });
    });
});
