import { IRegisterableComponent } from 'Router/_private/DataInterfaces';

export function createFakeControl(): IRegisterableComponent {
    const randomId = Math.random();
    return {
        getInstanceId: (): string => {
            return 'id-' + randomId;
        },
    };
}
