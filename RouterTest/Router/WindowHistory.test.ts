import WindowHistory from 'Router/_private/Router/WindowHistory';
import WindowLocation from 'Router/_private/Router/WindowLocation';

describe('Router/_private/Router/WindowHistory', () => {
    let windowHistory: WindowHistory;

    beforeEach(() => {
        windowHistory = new WindowHistory(new WindowLocation());
    });

    test('pushState', () => {
        const locationUpdateSpy = jest.spyOn(
            WindowLocation.prototype,
            '_update'
        );
        windowHistory.pushState({ state: '/path' }, '/path', '/path');
        expect(locationUpdateSpy).toBeCalledTimes(1);
        expect(locationUpdateSpy.mock.calls[0][0]).toBe('/path');
    });

    test('replaceState', () => {
        const locationUpdateSpy = jest.spyOn(
            WindowLocation.prototype,
            '_update'
        );
        windowHistory.replaceState({ state: '/path' }, '/path', '/path');
        expect(locationUpdateSpy).toBeCalledTimes(1);
        expect(locationUpdateSpy.mock.calls[0][0]).toBe('/path');
    });

    test('back', () => {
        windowHistory.pushState({ state: '/path' }, '/path', '/path');
        windowHistory.pushState(
            { state: '/path-another' },
            '/path-another',
            '/path-another'
        );

        const locationUpdateSpy = jest.spyOn(
            WindowLocation.prototype,
            '_update'
        );
        windowHistory.back();
        expect(locationUpdateSpy).toBeCalledTimes(1);
        expect(locationUpdateSpy.mock.calls[0][0]).toBe('/path');
    });
});
