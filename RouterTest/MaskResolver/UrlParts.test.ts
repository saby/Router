import { UrlParts } from 'Router/_private/MaskResolver/UrlParts';

const emptyUrlParts = new UrlParts('/');

describe('Router/_private/MaskResolver/UrlParts', () => {
    describe('init UrlParts', () => {
        it('simple url', () => {
            let urlParts = new UrlParts('/');
            expect(urlParts.getPath()).toEqual('');
            expect(urlParts.getQuery()).toEqual('');
            expect(urlParts.getFragment()).toEqual('');
            urlParts = new UrlParts('/path/');
            expect(urlParts.getPath()).toEqual('/path');
            expect(urlParts.getQuery()).toEqual('');
            expect(urlParts.getFragment()).toEqual('');
        });
        it('query url', () => {
            let urlParts = new UrlParts('/?param=value');
            expect(urlParts.getPath()).toEqual('');
            expect(urlParts.getQuery()).toEqual('?param=value');
            expect(urlParts.getFragment()).toEqual('');
            urlParts = new UrlParts('/path/?param=value');
            expect(urlParts.getPath()).toEqual('/path');
            expect(urlParts.getQuery()).toEqual('?param=value');
            expect(urlParts.getFragment()).toEqual('');
        });
        it('fragment url', () => {
            let urlParts = new UrlParts('/#fragment=value');
            expect(urlParts.getPath()).toEqual('');
            expect(urlParts.getQuery()).toEqual('');
            expect(urlParts.getFragment()).toEqual('#fragment=value');
            urlParts = new UrlParts('/path/#fragment=value');
            expect(urlParts.getPath()).toEqual('/path');
            expect(urlParts.getQuery()).toEqual('');
            expect(urlParts.getFragment()).toEqual('#fragment=value');
        });
        it('query fragment url', () => {
            let urlParts = new UrlParts('/?param=value#fragment=value');
            expect(urlParts.getPath()).toEqual('');
            expect(urlParts.getQuery()).toEqual('?param=value');
            expect(urlParts.getFragment()).toEqual('#fragment=value');
            urlParts = new UrlParts('/path/?param=value#fragment=value');
            expect(urlParts.getPath()).toEqual('/path');
            expect(urlParts.getQuery()).toEqual('?param=value');
            expect(urlParts.getFragment()).toEqual('#fragment=value');
        });
        it('bad urls', () => {
            const urlParts = new UrlParts('/path/#fragment?query=value');
            expect(urlParts.getPath()).toEqual('/path');
            expect(urlParts.getQuery()).toEqual('');
            expect(urlParts.getFragment()).toEqual('#fragment?query=value');
        });
    });

    describe('join UrlParts', () => {
        it('simple url', () => {
            let urlParts = { path: '', query: '', fragment: '' };
            let url = emptyUrlParts.join(urlParts);
            expect(url).toEqual('/');
            urlParts = { path: '/path', query: '', fragment: '' };
            url = emptyUrlParts.join(urlParts);
            expect(url).toEqual('/path');
        });
        it('query url', () => {
            let urlParts = { path: '', query: '?param=value', fragment: '' };
            let url = emptyUrlParts.join(urlParts);
            expect(url).toEqual('/?param=value');
            urlParts = { path: '/path', query: '?param=value', fragment: '' };
            url = emptyUrlParts.join(urlParts);
            expect(url).toEqual('/path?param=value');
        });
        it('fragment url', () => {
            let urlParts = { path: '', query: '', fragment: '#fragment=value' };
            let url = emptyUrlParts.join(urlParts);
            expect(url).toEqual('/#fragment=value');
            urlParts = {
                path: '/path',
                query: '',
                fragment: '#fragment=value',
            };
            url = emptyUrlParts.join(urlParts);
            expect(url).toEqual('/path#fragment=value');
        });
        it('query fragment url', () => {
            let urlParts = {
                path: '',
                query: '?param=value',
                fragment: '#fragment=value',
            };
            let url = emptyUrlParts.join(urlParts);
            expect(url).toEqual('/?param=value#fragment=value');
            urlParts = {
                path: '/path',
                query: '?param=value',
                fragment: '#fragment=value',
            };
            url = emptyUrlParts.join(urlParts);
            expect(url).toEqual('/path?param=value#fragment=value');
        });
        it('url with protocol', () => {
            let urlParts = {
                path: 'http://site',
                query: '?param=value',
                fragment: '',
            };
            let url = emptyUrlParts.join(urlParts);
            expect(url).toEqual('http://site?param=value');
            urlParts = {
                path: 'https://site',
                query: '?param=value',
                fragment: '',
            };
            url = emptyUrlParts.join(urlParts);
            expect(url).toEqual('https://site?param=value');
        });
    });

    describe('check trailing slash', () => {
        it('has trailing slash', () => {
            const urlParts = new UrlParts('/path/to/page/');
            const url = urlParts.join({ query: '?query=value' });
            expect(url).toEqual('/path/to/page/?query=value');
        });
        it('has not trailing slash', () => {
            const urlParts = new UrlParts('/path/to/page');
            const url = urlParts.join({ query: '?query=value' });
            expect(url).toEqual('/path/to/page?query=value');
        });
    });

    it('UrlParts.clearQuery', () => {
        const urlParts = new UrlParts('/path?query=value#fragment');
        urlParts.clearQuery();
        expect(urlParts.getPath()).toEqual('/path');
        expect(urlParts.getQuery()).toEqual('');
        expect(urlParts.getFragment()).toEqual('#fragment');
    });

    it('UrlParts.clearFragment', () => {
        const urlParts = new UrlParts('/path?query=value#fragment');
        urlParts.clearFragment();
        expect(urlParts.getPath()).toEqual('/path');
        expect(urlParts.getQuery()).toEqual('?query=value');
        expect(urlParts.getFragment()).toEqual('');
    });
});
