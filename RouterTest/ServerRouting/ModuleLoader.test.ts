import * as UIDeps from 'UI/Deps';
import { ModuleLoader } from 'Router/_ServerRouting/ModuleLoader';
import {
    IModuleNotFound,
    IModuleFound,
} from 'Router/_ServerRouting/Interfaces/IModuleLoader';
import { PageSourceStatus } from 'Router/_ServerRouting/Interfaces/IPageSource';

jest.useFakeTimers();

describe('Router/_ServerRouting/ModuleLoader', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('загрузка несуществующего модуля', () => {
        const moduleName = 'Module/Index';

        // заглушка метода проверки существования модуля, который строим
        const isModuleExistsStub = jest.spyOn(UIDeps, 'isModuleExists');
        const loadResult: IModuleNotFound | IModuleFound =
            new ModuleLoader().load(moduleName);

        // Должен быть вызван метод проверки существования модуля
        expect(isModuleExistsStub).toHaveBeenCalledTimes(1);
        expect(isModuleExistsStub).toHaveBeenCalledWith(moduleName);
        expect(loadResult.loadStatus).toBe('not_found');
        expect((loadResult as IModuleNotFound).notFound.status).toBe(
            PageSourceStatus.NOT_FOUND
        );
    });

    it('загрузка существующего модуля', () => {
        const moduleName = 'RouterTest/Index';

        // заглушка метода проверки существования модуля, который строим
        const isModuleExistsOriginal = UIDeps.isModuleExists.bind(UIDeps);
        const isModuleExistsStub = jest
            .spyOn(UIDeps, 'isModuleExists')
            .mockImplementation((name) => {
                if (name === moduleName) {
                    return true;
                }

                return isModuleExistsOriginal(name);
            });
        const loadResult: IModuleNotFound | IModuleFound =
            new ModuleLoader().load(moduleName);

        // Должен быть вызван метод проверки существования модуля
        expect(isModuleExistsStub).toHaveBeenCalledTimes(1);
        expect(isModuleExistsStub).toHaveBeenCalledWith(moduleName);
        expect(loadResult.loadStatus).toBe('success');
        expect((loadResult as IModuleFound).module).toEqual(
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            require(moduleName)
        );
    });
});
