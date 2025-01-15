import { useMemo, forwardRef, Ref, cloneElement, ReactElement } from 'react';
import { WasabyContextManager } from 'UI/Contexts';
import { getRootRouter, IRouter } from '../Router/Router';
import Context from './Context';

/**
 * Интерфейс опций провайдера для контекста {@link Router/router:Context}
 * @public
 */
export interface IContextProps {
    /**
     * Объект реализующий интерфейс API работы с роутингом
     */
    Router: IRouter;
    children: ReactElement;

    /**
     * Этой опцией создается обертка с WasabyContextManager'ом с новым Router'ом
     * Надо так делать, чтобы в прикладных местах не приходилось вставлять WasabyContextManager только ради Router'а
     * Необходимо так оборачивать из-за Wasaby|React бутербродов
     * После перевода прикладные места на хук useRouter или обертку withRouter
     * можно будет удалить Router из WasabyContextManager и оборачивание в WasabyContextManager.
     */
    forwardRouter?: boolean;
}

/**
 * Провайдер для контекста {@link Router/router:Context}
 * @public
 */
const ContextProvider = forwardRef(function ContextProvider(
    props: IContextProps,
    ref: Ref<HTMLElement>
) {
    const router = useMemo<IRouter>(() => {
        return props.Router || getRootRouter(true);
    }, [props.Router]);

    const children = !ref ? props.children : cloneElement(props.children as ReactElement, { ref });

    const content =
        props.forwardRouter === true ? (
            <WasabyContextManager Router={router}>{children}</WasabyContextManager>
        ) : (
            children
        );

    return <Context.Provider value={router}>{content}</Context.Provider>;
});

ContextProvider.displayName = 'Router/router:ContextProvider';
export default ContextProvider;
