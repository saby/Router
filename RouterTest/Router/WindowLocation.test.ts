import WindowLocation from 'Router/_private/Router/WindowLocation';

describe('Router/_private/Router/WindowHistory', () => {
    let windowLocation: WindowLocation;

    beforeEach(() => {
        windowLocation = new WindowLocation();
    });

    describe('update url', () => {
        test('path', () => {
            windowLocation._update('/path');
            expect(windowLocation.pathname).toBe('/path');
            expect(windowLocation.search).toBe('');
            expect(windowLocation.hash).toBe('');
        });

        test('path + query', () => {
            windowLocation._update('/path?query');
            expect(windowLocation.pathname).toBe('/path');
            expect(windowLocation.search).toBe('?query');
            expect(windowLocation.hash).toBe('');
        });

        test('path + fragment', () => {
            windowLocation._update('/path#fragment');
            expect(windowLocation.pathname).toBe('/path');
            expect(windowLocation.search).toBe('');
            expect(windowLocation.hash).toBe('#fragment');
        });

        test('path + query + fragment', () => {
            windowLocation._update('/path?query#fragment');
            expect(windowLocation.pathname).toBe('/path');
            expect(windowLocation.search).toBe('?query');
            expect(windowLocation.hash).toBe('#fragment');
        });
    });
});
