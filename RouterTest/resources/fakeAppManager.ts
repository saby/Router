export function createFakeApp(appName: string): void {
    define(appName + '/Index', () => {
        return {};
    });
}
