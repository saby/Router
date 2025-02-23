import RouterManager from 'Router/_private/Router/RouterManager';
import {
    IRegisteredRoute,
    IRegisteredReference,
} from 'Router/_private/DataInterfaces';

export default class RouterManagerTest extends RouterManager {
    getRegisteredRoutes(): Record<string, IRegisteredRoute> {
        return this._registeredRoutes;
    }

    getRegisteredReferences(): Record<string, IRegisteredReference> {
        return this._registeredReferences;
    }
}
