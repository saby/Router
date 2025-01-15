import { loadAsync } from 'WasabyLoader/ModulesLoader';
import { addPageDeps } from 'UI/Deps';
import { MaskResolver, ContextProvider, IRouter } from 'Router/router';
import Bootstrap from 'UI/Bootstrap';
import Main from './Main';

interface IProps {
    Router: IRouter;
}

/**
 * Точка входа для демонстрации роутинга
 */
export default function Index(props: IProps): JSX.Element {
    return (
        <ContextProvider Router={props.Router}>
            <Bootstrap>
                <Main />
            </Bootstrap>
        </ContextProvider>
    );
}

export function getDataToRender(url: string): Promise<void> | void {
    const pageId = MaskResolver.calculateUrlParams('/RouterDemo/page/:pageId', url).pageId;
    if (!pageId) {
        return;
    }
    const moduleName = 'RouterDemo/resources/' + pageId;
    return loadAsync(moduleName).then(() => {
        addPageDeps([moduleName]);
        return;
    });
}
