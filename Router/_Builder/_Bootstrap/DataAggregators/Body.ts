import { Body as AppBody } from 'Application/Page';
import { IDataAggregatorModule, IFullData } from 'Router/_Builder/_Bootstrap/Interface';

export class Body implements IDataAggregatorModule {
    execute(): Partial<IFullData> | null {
        const BodyAPI = AppBody.getInstance();

        return {
            BodyAPIClasses: BodyAPI.getClassString(),
            directionality: BodyAPI.getDir(),
        };
    }
}
