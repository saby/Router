import {
    Component,
    cloneElement,
    ReactElement,
    Ref,
    forwardRef,
    JSXElementConstructor,
    useContext,
} from 'react';
import { detection } from 'Env/Env';
import { getWasabyContext } from 'UI/Contexts';
import { getRootRouter, IRouter } from './Router/Router';
import { IHistoryState, IRegisterableComponent } from './DataInterfaces';
import ContextProvider from './context/ContextProvider';
import RouterContext from './context/Context';

/**
 * Объект события
 * @public
 */
export interface ISyntheticMouseEvent {
    preventDefault: () => void;
    nativeEvent: MouseEvent;
    routerReferenceNavigation?: boolean;
    stopPropagation: Function;
}

/**
 * Опции класса
 * @public
 */
export interface IReferenceProps extends Record<string, unknown> {
    /**
     * Маска, определяющая как должен быть изменен текущий адрес при переходе по ссылке.
     * @remark
     * В маске указывается та часть адреса, которая должне быть изменена при переходе по ссылке. Значение
     * для каждого placeholder'a также должно быть передано в Reference в качестве опции (см. пример).
     *
     * Опция state поддерживает те же типы масок, что и Router.router:Route. Более подробно о видах масок
     * можно <a href="https://wasaby.dev/doc/platform/routing/mask-and-syntax/">прочитать в статье</a>.
     *
     * Если маска в текущем адресе отсутствует, URL-адрес при переходе будет не изменен, а дополнен этой
     * маской с соответствующим значением.
     * Если вместо значений параметров передана опция `clear="{{ true }}"`, вместо изменения или дополнения
     * URL-адреса по маске, часть адреса, совпадающая с маской, будет удалена из URL.
     * @see Router/router:IReferenceProps#clear
     * @see Router/router:IReferenceProps#href
     * @example
     * <pre>
     * <Router.router:Reference state="destination/:country" country="Italy">
     *    <a href="{{ content.href }}">Go to Italy</a>
     * </Router.router:Reference>
     * </pre>
     *
     * Текущий адрес: "/book" -> После перехода: "/book/destination/Italy"
     * Текущий адрес: "/book/destination/Russia" -> После: "/book/destination/Italy"
     * Текущий адрес: "/book/destination/USA/day/Tue?price=mid" -> После: "/book/destination/Italy/day/Tue?price=mid"
     * Текущий адрес: "/book/all" -> После: "/book/all/destination/Italy"
     *
     * Чтобы удалить параметр из URL-адреса, необходимо его добавить в маску, но не передавать для него значение
     * <pre>
     * <Router.router:Reference state="destination/:country/day/:dayName" country="Italy">
     *    <a href="{{ content.href }}">Go to Italy</a>
     * </Router.router:Reference>
     * </pre>
     *
     * Текущий адрес: "/book/destination/USA/day/Tue?price=mid" -> После: "/book/destination/Italy?price=mid"
     */
    state: string;
    /**
     * Маска, определяющая как должен быть изменен "красивый" адрес при переходе по ссылке.
     * @see Router/router:IReferenceProps#state
     * @remark
     * "Красивым" называется адрес, отображающийся в адресной строке браузера пользователя. Он не обязательно
     * должен соответствовать реальному адресу, с которым работает система роутинга.
     *
     * Если опция href не задана, в качестве красивого адреса будет использоваться реальный адрес, изменяемый
     * опцией state, что подходит в большинстве случаев.
     *
     * Более подробно о красивых адресах можно <a href="https://wasaby.dev/doc/platform/routing/#beautiful-link">
     * прочитать в статье</a>.
     *
     * Опция href поддерживает те же виды масок и параметров, как и опция state.
     */
    href?: string;
    /**
     * Определяет, нужно ли удалить часть адреса, соответствующую маскам (state и href).
     * Если эта опция не установлена, часть адреса будет изменена, а не удалена. По умолчанию false.
     * @remark
     * При установленной опции clear, при переходе по Reference, часть адреса соответствующая маскам
     * будет удалена, вместо изменения.
     * @example
     * <pre>
     * <Router.router:Reference state="type/:regType" clear="{{true}}">
     *    <a href="{{ content.href }}">Change registration type</a>
     * </Router.router:Reference>
     * </pre>
     * Текущий адрес: "/signup/type/company" -> После перехода: "/signup"
     * Текущий адрес: "/signup" -> После перехода: "/signup"
     * Текущий адрес: "/signup/type/individual/oauth?ref=email" -> После перехода: "/signup/oauth?ref=email"
     */
    clear?: boolean;
    /**
     * Признак того, что нужно пересчитывать url ссылки при наведении на неё мышкой.
     * По умолчанию false.
     */
    recalcUrlBeforeNavigate?: boolean;
    /**
     * Признак того, что необходимо полностью заменить url переданной маской. По умолчанию false.
     * @example
     * <pre>
     * <Router.router:Reference state="destination/:country" country="Italy" replace={{true}}>
     *    <a href="{{ content.href }}">Go to Italy</a>
     * </Router.router:Reference>
     * </pre>
     *
     * Текущий адрес: "/some/url" -> После перехода: "/destination/Italy"
     */
    replace?: boolean;
    /**
     * Признак того, что необходимо учитывать слеш в конце маски. По умолчанию false.
     * @example
     * <pre>
     * <Router.router:Reference state="/destination/:country/" country="Italy" trailingSlash={{true}}>
     *    <a href="{{ content.href }}">Go to Italy</a>
     * </Router.router:Reference>
     * </pre>
     * Текущий адрес: "/some/url" -> После перехода: "/destination/Italy/"
     */
    trailingSlash?: boolean;

    /**
     * Коллбек при клике на Reference, перед совершением перехода.
     * @param newState Состояние, в которое Reference совершает переход
     * @param syntheticClickEvent Объект события клика, который привел к совершению перехода
     * @remark
     * В обработчике onNavigate можно выполнить действия перед переходом в новое состояние.
     * Состояние, переданное в качестве параметра события, может быть изменено, чтобы изменить
     * результат перехода.
     * Из обработчика события можно вернуть **false**, чтобы предотвратить переход.
     */
    onNavigate?: (newState: IHistoryState, syntheticClickEvent: ISyntheticMouseEvent) => boolean;

    content?: Function;

    children: ReactElement;

    className?: string;

    forwardedRef?: Ref<HTMLElement>;
}

/**
 * Интерфейс состяния компонента
 * @private
 */
export interface IReferenceState {
    state: string;
    href: string;
}

let counter: number = 0;

/**
 * Компонент, вычисляющий новый URL-адрес по заданной маске и указанным параметрам.
 * Вычисленный адрес передается внутрь компонента под именем href.
 * При клике на Reference совершается переход по выбранному адресу без перезагрузки страницы.
 *
 * <a href="https://wasaby.dev/doc/platform/routing/#router-references">Статья о компоненте</a>
 *
 * @example
 * Обычно Router.router:Reference используется в сочетании с элементом ссылки `a`, так как
 * это позволяет пользователю видеть адрес перед кликом на ссылку в браузере.
 *
 * <pre>
 * <Router.router:Reference state="destination/:country" country="Italy">
 *    <a href="{{ content.href }}">Go to Italy</a>
 * </Router.router:Reference>
 * </pre>
 *
 * Текущий адрес: "/book" -> После клика: "/book/destination/Italy"
 * Текущий адрес: "/book/destination/Russia" -> После перехода: "/book/destination/Italy"
 * Текущий адрес: "/book/destination/0/day/Tue?price=mid" -> После перехода: "/book/destination/Italy/day/Tue?price=mid"
 * Текущий адрес: "/book/all" -> После перехода: "/book/all/destination/Italy"
 *
 * @public
 * @author Мустафин Л.И.
 */
class Reference
    extends Component<IReferenceProps, IReferenceState>
    implements IRegisterableComponent
{
    context: IRouter;
    private readonly _instId: string = 'reference_' + counter++;

    /**
     * Конструктор класса
     */
    constructor(props: IReferenceProps, context: IRouter) {
        super(props);

        this.state = recalcHref(props, context || getRootRouter(true));

        this._mousedownHandler = this._mousedownHandler.bind(this);
        this._clickHandler = this._clickHandler.bind(this);
        this._mouseoverHandler = this._mouseoverHandler.bind(this);
    }

    getInstanceId(): string {
        return this._instId;
    }

    componentDidMount(): void {
        this.Router._manager.addReference(this, () => {
            this.setState(recalcHref(this.props, this.Router));
            return true;
        });
    }

    componentDidUpdate(_: Readonly<IReferenceProps>, prevState: Readonly<IReferenceState>): void {
        const newState = recalcHref(this.props, this.Router);
        if (prevState.state !== newState.state || prevState.href !== newState.href) {
            this.setState(newState);
        }
    }

    componentWillUnmount(): void {
        this.Router._manager.removeReference(this);
    }

    render(): ReactElement {
        const props = {
            ...this.props.children?.props,
            className: this.props.className,
            href: this.state.href || this.state.state,
            onMouseDown: this._mousedownHandler,
            onClick: this._clickHandler,
            onMouseOver: this._mouseoverHandler,
            // коллбек onMouseOver для списков необходимо прокидывать как onMouseOverCallback
            // https://online.sbis.ru/opendoc.html?guid=8921e8d2-dfa7-49dd-8ae4-c7f98c54f02d&client=3
            onMouseOverCallback: this._mouseoverHandler,
            ref: this.props.forwardedRef,
            'data-qa': this.props['data-qa'],
        };
        return cloneElement(this.props.children, props);
    }

    protected get Router(): IRouter {
        return this.context || getRootRouter(true);
    }

    protected _mousedownHandler(e: ISyntheticMouseEvent): void {
        // обрабатываем только если кликнули левой кнопкой мыши
        if (e.nativeEvent.button !== 0) {
            return;
        }

        // если зажата клавиша Ctrl или это MacOs и зажата клавиша Cmd то ничего не делаем,
        // чтобы событие дошло до обработчика onClick - там нативно откроется ссылку в новой вкладке в фоне
        if (e.nativeEvent.ctrlKey || (detection.isMacOSDesktop && e.nativeEvent.metaKey)) {
            return;
        }

        const navigateTo: IHistoryState = {
            state: this.state.state,
            href: this.state.href,
        };

        // Tag the event as handled by Router.router:Reference, useful
        // for checks in other routing components
        e.routerReferenceNavigation = true;

        // navigate event can be handled by the user to prevent the
        // standard single page navigation
        if (!this.props.onNavigate || this.props.onNavigate(navigateTo, e) !== false) {
            this.Router.navigate(navigateTo);
        }
    }

    /**
     * Обработка клика по ссылке
     * просто отменим событие клика, т.к. переход на новый url происходит по mousedown
     * @param e
     */
    protected _clickHandler(e: ISyntheticMouseEvent): void {
        // если зажата клавиша Ctrl или это MacOs и зажата клавиша Cmd то не отменяем обработку события,
        // чтобы нативно открылась ссылка в новой вкладке в фоне
        if (e.nativeEvent.ctrlKey || (detection.isMacOSDesktop && e.nativeEvent.metaKey)) {
            return;
        }

        // иначе отменим обработку onClick только для левой кнопки мыши
        if (e.nativeEvent.button === 0) {
            e.preventDefault();
        }
    }

    // для https://online.sbis.ru/opendoc.html?guid=fc34605f-3642-4a94-acdf-d2804df07069
    protected _mouseoverHandler(): void {
        if (this.props.recalcUrlBeforeNavigate) {
            this.setState(recalcHref(this.props, this.Router, this.Router.url.getUrl()));
        }
    }

    static contextType: typeof RouterContext = RouterContext;

    static displayName: string = 'Router/router:Reference';
}

export { Reference };

/**
 * Обертка над {@link Router/router:BaseReference} для того, чтобы для него всегда Router был в {@link Router/router:Context контексте}.
 * Приходится входящий ref прокидывать как forwardedRef, т.к. есть места, где Reference ставят в корень Wasaby контрола
 * и у него ломаются события, т.к. не устанавливается _container
 */
const ReferenceWrapper = forwardRef(function Wrapper(
    props: IReferenceProps,
    ref: Ref<HTMLElement>
): ReactElement<IReferenceProps, JSXElementConstructor<Reference>> {
    const Router = useContext(RouterContext);
    const context = useContext(getWasabyContext());

    if (context.Router && (!Router || context.Router.instId > Router.instId)) {
        return (
            <ContextProvider Router={context.Router}>
                <Reference {...props} forwardedRef={ref} />
            </ContextProvider>
        );
    }
    return <Reference {...props} forwardedRef={ref} />;
});

ReferenceWrapper.displayName = `wrapToContext(${Reference.displayName})`;

export default ReferenceWrapper;

function recalcHref(
    props: IReferenceProps,
    router: IRouter,
    currentUrl?: string
): { state: string; href: string } {
    const state = router.maskResolver.calculateHref(props.state, props, currentUrl);
    let href;
    if (props.href) {
        const url = router.urlRewriter.getReverse(currentUrl || router.url.getStateUrl());
        href = router.maskResolver.calculateHref(props.href, props, url);
    } else {
        const _href = router.urlRewriter.getReverse(state);
        href = router.url.getServiceUrl(_href);
    }
    return { state, href };
}
