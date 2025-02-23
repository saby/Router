import { renderStatic } from 'Router/Builder';

describe('renderStatelessStatic', () => {
    test('main', () => {
        // @ts-ignore
        const html = renderStatic({
            wsRoot: '%{WI.SBIS_ROOT}',
            resourceRoot: '%{RESOURCE_ROOT}',
            metaRoot: '%{META_ROOT}',
            defaultServiceUrl: '%{SERVICES_PATH}',
            appRoot: '%{APPLICATION_ROOT}',
            // @ts-ignore
            RUMEnabled: '%{RUM_ENABLED}',
            pageName: '%{PAGE_NAME}',
            builder: 'function anonymous() {return"";}',
            buildStateless: true,
            dependencies: ['Module/Index'],
        });
        expect(html).toMatchSnapshot();
    });
});
