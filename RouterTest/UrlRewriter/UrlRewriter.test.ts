import UrlRewriter, { _prepareRoutes } from 'Router/_private/UrlRewriter';
// @ts-ignore
import * as routerJson from 'RouterTest/resources/router';

interface ITestData {
    url: string;
    result: string;
}

const tests: ITestData[] = [
    {
        url: '/',
        result: '/OnlineSbisRu',
    },
    {
        url: '/12345',
        result: '/OnlineSbisRu/12345',
    },
    {
        url: '/a',
        result: '/a',
    },
    {
        url: '/a/b',
        result: '/ab',
    },
    {
        url: '/a/b/c',
        result: '/ab/c',
    },
    {
        url: '/a/b/c/d',
        result: '/abcd',
    },
    {
        url: '/a/b/c/d/e',
        result: '/abcd/e',
    },
];
const testsReverse: ITestData[] = [
    {
        url: '/OnlineSbisRu',
        result: '/',
    },
    {
        url: '/OnlineSbisRu/12345',
        result: '/12345',
    },
    {
        url: '/a',
        result: '/a',
    },
    {
        url: '/ab',
        result: '/a/b',
    },
    {
        url: '/ab/c',
        result: '/a/b/c',
    },
    {
        url: '/abcd',
        result: '/a/b/c/d',
    },
    {
        url: '/abcd/e',
        result: '/a/b/c/d/e',
    },
];

describe('Router/UrlRewriter', () => {
    let urlRewriter: UrlRewriter;

    function runTests(testArr: ITestData[]): void {
        testArr.forEach((test: ITestData) => {
            expect(urlRewriter.get(test.url)).toBe(test.result);
        });
    }

    function runTestsReverse(testArr: ITestData[]): void {
        testArr.forEach((test: ITestData) => {
            expect(urlRewriter.getReverse(test.url)).toBe(test.result);
        });
    }

    beforeEach(() => {
        urlRewriter = new UrlRewriter(_prepareRoutes(routerJson));
    });

    it('does not throw if routes.json did not load', () => {
        // @ts-ignore
        expect(_prepareRoutes.bind(null, null)).not.toThrow();
        // @ts-ignore
        expect(_prepareRoutes.bind(null, undefined)).not.toThrow();
        expect(_prepareRoutes.bind(null, {})).not.toThrow();
    });

    it('правильно обрабатывается "constructor" в url', () => {
        // из объекта router.json необходимо искать части путей через hasOwnProperty
        // иначе будут получены методы и поля Object, например constructor
        expect(urlRewriter.get('/page/constructor/some')).toBe('/Module/page/constructor/some');
    });

    describe('forward rewrite', () => {
        it('rewrites the url', () => {
            runTests(tests);
        });

        it('ignores query in the url', () => {
            const queryString = '?paramA=true&paramB=false';
            const queryTests = tests.map((test) => {
                return {
                    url: test.url + queryString,
                    result: test.result + queryString,
                };
            });

            runTests(queryTests);
        });

        it('ignores hash in the url', () => {
            const hashString = '#userid=00000111';
            const hashTests = tests.map((test) => {
                return {
                    url: test.url + hashString,
                    result: test.result + hashString,
                };
            });

            runTests(hashTests);
        });

        it('ignores query and hash in the url if both are present', () => {
            const combinedString = '?paramA=true&paramB=false#userid=00000111';
            const combinedTests = tests.map((test) => {
                return {
                    url: test.url + combinedString,
                    result: test.result + combinedString,
                };
            });

            runTests(combinedTests);
        });

        it('returns urls as is if routes.json did not load', () => {
            // @ts-ignore
            urlRewriter = new UrlRewriter(_prepareRoutes(null));

            const resEqUrl = tests.map((test) => {
                return {
                    url: test.url,
                    result: test.url,
                };
            });

            runTests(resEqUrl);
        });
    });

    describe('reverse rewrite', () => {
        it('rewrites the url', () => {
            runTestsReverse(testsReverse);
        });

        it('ignores query in the url', () => {
            const queryString = '?paramA=true&paramB=false';
            const queryTests = testsReverse.map((test) => {
                return {
                    url: test.url + queryString,
                    result: test.result + queryString,
                };
            });

            runTestsReverse(queryTests);
        });

        it('ignores hash in the url', () => {
            const hashString = '#userid=00000111';
            const hashTests = testsReverse.map((test) => {
                return {
                    url: test.url + hashString,
                    result: test.result + hashString,
                };
            });

            runTestsReverse(hashTests);
        });

        it('ignores query and hash in the url if both are present', () => {
            const combinedString = '?paramA=true&paramB=false#userid=00000111';
            const combinedTests = testsReverse.map((test) => {
                return {
                    url: test.url + combinedString,
                    result: test.result + combinedString,
                };
            });

            runTestsReverse(combinedTests);
        });

        it('returns urls as is if routes.json did not load', () => {
            // @ts-ignore
            urlRewriter = new UrlRewriter(_prepareRoutes(null));

            const resEqUrl = testsReverse.map((test) => {
                return {
                    url: test.url,
                    result: test.url,
                };
            });

            runTestsReverse(resEqUrl);
        });
    });

    describe('регулярные выражения в router.json', () => {
        it('/<regex>', () => {
            const url = '/some';
            const result = '/Module/some';
            expect(urlRewriter.get(url)).toBe(result);
        });
        it('/<regex>/path', () => {
            let url = '/some/path';
            let result = '/Module/some/path';
            expect(urlRewriter.get(url)).toBe(result);

            url = '/some/another-path';
            result = '/Module/some/another-path';
            expect(urlRewriter.get(url)).toBe(result);
        });
        it('/path/<regex>', () => {
            const url = '/path/some';
            const result = '/Module/path/some';
            expect(urlRewriter.get(url)).toBe(result);
        });
        it('/path/<regex>/<regex>', () => {
            const url = '/path/some/value';
            const result = '/Module/path/some/value';
            expect(urlRewriter.get(url)).toBe(result);
        });
        it('/path/<regex>/some/<regex>', () => {
            const url = '/path/first/some/second';
            const result = '/Module/path/first/some/second';
            expect(urlRewriter.get(url)).toBe(result);
        });
    });
});
