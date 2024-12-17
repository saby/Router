import {
    Component,
    cloneElement,
    ReactNode,
    Ref,
    forwardRef,
    ReactElement,
    JSXElementConstructor,
    useContext,
} from 'react';
import { logger } from 'Application/Env';
import { getWasabyContext } from 'UI/Contexts';
import { IHistoryState, IRegisterableComponent, TStateChangeFunction } from './DataInterfaces';
import { getRootRouter, IRouter } from './Router/Router';
import ContextProvider from './context/ContextProvider';
import RouterContext from './context/Context';

/**
 * Интерфейс прогрессбара.
 * @public
 */
export interface IProgressBar {
    /**
     * Метод, который будет вызван для показа прогрессбара перед загрузкой данных перед SPA переходом
     */
    show: () => void;
    /**
     * Метод, который будет вызван для скрытия прогрессбара после SPA перехода
     */
    hide: () => void;
}

/**
 * Фунция получения данных для рендера.
 */
export type TGetDataToRender = (props: Record<string, unknown>) => Promise<unknown>;

/**
 * Пропсы для роутера
 * @public
 */
export interface IRouteProps {
    /**
     * Строка, содержащая специальные placeholder'ы для параметров, начинающиеся с двоеточия.
     * Эти placeholder'ы используются для обозначения определенного параметра в URL-адресе.
     * @remark
     * Значение параметра извлекается из URL и передается внутрь Router.router:Route с именем placeholder'a.
     * При изменении значения параметра в URL-адресе, обновится сам компонент Route, и внутрь него будет передано новое
     * значение параметра.
     *
     * Маски бывают двух видов.
     *
     * Первый - обычная маска с символом `/`, например `paramName/:paramValue`. Она может содержать любое число
     * placeholder'ов, например `tour/:priceMin/:priceMax`.
     * Второй - query-маска с символом `=`, например `paramName=:paramValue`. Она может содержать только один
     * placeholder. Такая маска извлекает значение из "GET-параметров" текущего URL после знака вопроса. Например,
     * для URL-адреса `/mypurchases?filtered=true&paramName=age&greaterthan=2` приведенная выше маска излечет параметр
     * `paramValue` со значением `2`.
     *
     * Более подробно виды масок описаны <a href="/doc/platform/developmentapl/interface-development/routing/mask-and-syntax/">в статье о роутинге</a>.
     * @example
     * Маска: "paramName/:paramValue"
     *
     * URL: "/paramName/valueOne"        -> paramValue = "valueOne"
     * URL: "/paramName/value/Two"       -> paramValue = "value"
     * URL: "/paramName/value?num=three" -> paramValue = "value"
     * URL: "/paramName/value#Four"      -> paramValue = "value"
     */
    mask: string;

    /**
     * Объект прогрессбар, который будет показан во время загрузки данных перед SPA переходом
     */
    progressBar?: IProgressBar;

    /**
     * Метод загрузки данных для детей при SPA переходе.
     */
    getDataToRender?: TGetDataToRender;

    /**
     * Срабатывает перед каждым изменением url адреса
     * @return Значение false остановит переход.
     */
    onBeforeChange?: TStateChangeFunction;

    /**
     * Срабатывает после перехода, в котором адрес начинает соответствовать маске
     * @example
     * <pre>
     * <Router.router:Route mask="search/:query">...</Router.router:Route>
     * </pre>
     * Текущий адрес: "/home"
     * Переход по адресу: "/page/search/My+query" -> срабатывает on:enter
     */
    onEnter?: TStateChangeFunction;

    /**
     * Срабатывает после перехода, в котором адрес перестает соответствовать маске
     * @example
     * <pre>
     * <Router.router:Route mask="search/:query">...</Router.router:Route>
     * </pre>
     * Текущий адрес: "/page/search/My+query"
     * Переход по адресу: "/about" -> срабатывает on:leave
     */
    onLeave?: TStateChangeFunction;

    /**
     * Срабатывает после перехода, в котором значение параметров маски изменилось
     * @example
     * <pre>
     * <Router.router:Route mask="alert/:alertType" on:urlChange="changeAlert()" />
     * </pre>
     * <pre>
     * Текущий адрес: "/home"
     * Переход по адресу: "/home/alert/signup" -> changeAlert(event, { alertType: 'signup' }, { alertType: undefined })
     * Переход по адресу: "/home/alert/login"  -> changeAlert(event, { alertType: 'login' }, { alertType: 'signup' })
     * Переход по адресу: "/home"              -> changeAlert(event, { alertType: undefined }, { alertType: 'login' })
     * </pre>
     */
    onUrlChange?: TStateChangeFunction;

    children?: ReactNode | undefined;

    contentWidth?: number | undefined;

    forwardedRef?: Ref<HTMLElement>;
}

const FILTERED_OPTIONS_NAMES: string[] = [
    'content',
    'mask',
    'theme',
    '_isSeparatedOptions',
    '_logicParent',
    'readOnly',
    'children',
    'getDataToRender',
];
let counter: number = 0;

/**
 * Компонент-роутер, извлекает параметры из текущего URL по заданной
 * маске, и передает их значения своим детям.
 *
 * <a href="https://github.com/saby/Router#using-route-to-match-urls">Статья о компоненте</a>
 *
 * @example
 * <pre>
 * <Router.router:Route mask="destination/:myDestination">
 *    <p>Значение параметра: {{ content.myDestination }}</p>
 * </Router.router:Route>
 * </pre>
 *
 * @author Мустафин Л.И.
 * @public
 */
class Route extends Component<IRouteProps> implements IRegisterableComponent {
    protected _urlOptions: Record<string, unknown> = {};
    protected _pageConfig: unknown;
    private _isResolved: boolean = false;
    private _urlOptionsFields: string[] = [];
    private _needLoadData: boolean = false;
    private _progressBar?: IProgressBar;
    private _getDataToRender?: TGetDataToRender;
    private _newLoc: IHistoryState;

    private readonly _instId: string = 'activator_' + counter++;

    /**
     * Конструктор класса
     */
    constructor(props: IRouteProps & Record<string, unknown>, context: IRouter) {
        super(props);
        this._urlOptions = {};
        this._progressBar = props.progressBar;
        this._getDataToRender = props.getDataToRender;
        this._applyNewUrl(props.mask, context || getRootRouter(true), props);
    }

    componentDidMount(): void {
        if (typeof window !== 'undefined') {
            this._register();
        }
        this._checkUrlResolved();
    }

    render() {
        this._applyNewUrl(this.props.mask, this.Router, this.props, this._newLoc?.state);

        return this.props.children ? (
            // @ts-ignore
            cloneElement(this.props.children, {
                ...this._urlOptions,
                pageConfig: this._pageConfig,
                forwardedRef: this.props.forwardedRef,
                // @ts-ignore
                children: this.props.children?.props?.children,
                // @ts-ignore
                content: this.props.children?.props?.content,
            })
        ) : (
            <span></span>
        );
    }

    componentDidUpdate(prevProps: Readonly<IRouteProps>): void {
        if (prevProps.contentWidth !== this.props.contentWidth) {
            this._needLoadData = true;
            this._afterApplyNewUrl();
        }
    }

    componentWillUnmount() {
        this._unregister();
        /* В случаях когда роут разрушается,
            но URL страницы все же подходит */
        if (this._isResolved && this.props.onLeave) {
            this.props.onLeave(this._newLoc, this._newLoc);
        }
    }

    getInstanceId(): string {
        return this._instId;
    }

    protected get Router(): IRouter {
        return this.context || getRootRouter(true);
    }

    private _register(): void {
        this.Router._manager.addRoute(
            this as IRegisterableComponent,
            (newLoc: IHistoryState, oldLoc: IHistoryState) => {
                return this._beforeApplyNewUrl(newLoc, oldLoc);
            },
            () => {
                this._afterApplyNewUrl();
                return true;
            }
        );
    }

    private _unregister(): void {
        this.Router._manager.removeRoute(this);
    }

    /**
     * Действие, которое выполнится ПЕРЕД сменой url-адреса
     */
    private _beforeApplyNewUrl(
        newLoc: IHistoryState,
        oldLoc: IHistoryState
    ): boolean | Promise<boolean> {
        this._needLoadData = false;
        this._newLoc = newLoc;

        const applyNewUrlOptions = (
            beforeChangeResult: boolean | Promise<boolean> | undefined
        ): boolean | Promise<boolean> => {
            if (beforeChangeResult === false) {
                return false;
            }
            let result: boolean = true;

            const oldUrlOptions: Record<string, unknown> = this._urlOptions;
            const hasResolvedParam: boolean = this._applyNewUrl(
                this.props.mask,
                this.Router,
                this.props,
                newLoc.state
            );

            if (hasResolvedParam && !this._isResolved) {
                // @ts-ignore
                result = this.props.onEnter?.(newLoc, oldLoc);
                this._isResolved = true;
            } else if (!hasResolvedParam && this._isResolved) {
                // @ts-ignore
                result = this.props.onLeave?.(newLoc, oldLoc);
                this._isResolved = false;
            }

            if (this._didOptionsChange(this._urlOptions, oldUrlOptions)) {
                // @ts-ignore
                this.props.onUrlChange?.call(this, this._urlOptions, oldUrlOptions);
                this._needLoadData = true;
            }
            return beforeChangeResult || result;
        };

        // @ts-ignore
        const result = this.props.onBeforeChange?.(newLoc, oldLoc);

        if (result && (result as Promise<boolean>).then) {
            return (result as Promise<boolean>)
                .then((res) => {
                    return applyNewUrlOptions(res);
                })
                .catch((err) => {
                    logger.error(err);
                    return false;
                });
        }
        return applyNewUrlOptions(result);
    }

    /**
     * Действие, которое выполнится ПОСЛЕ смены url-адреса
     */
    private _afterApplyNewUrl(): void {
        if (!this._getDataToRender) {
            // поддержка старого поведения
            this.setState({ updated: {} });
            return;
        }

        if (!this._needLoadData) {
            return;
        }

        this._progressBar?.show();
        const oldUrlOptions = this._urlOptions;
        this._getDataToRender(this._urlOptions).then((pageConfig: unknown) => {
            // пока вызываем _getDataToRender пользователь мог уже кликнуть по другой ссылке
            // и загруженные данные уже неактульны. Поэтому pageConfig присваиваем только если загруженные
            // данные актуальны для текущего состояния Route
            if (!this._didOptionsChange(this._urlOptions, oldUrlOptions)) {
                this._pageConfig = pageConfig;
                this._needLoadData = false;
                this.setState({ updated: {} });
            }
        });
    }

    private _applyNewUrl(
        mask: string,
        Router: IRouter,
        options: IRouteProps & Record<string, unknown>,
        newState?: string
    ): boolean {
        this._setUrlOptions(Router.maskResolver.calculateUrlParams(mask, newState));
        const hasResolvedParam: boolean = this._hasResolvedParams(this._urlOptions);
        this._fillUrlOptionsFromOptions(options);
        return hasResolvedParam;
    }

    /**
     * Выяснить после разбора маски нашлись ли какие либо параметры в url-адресе
     */
    private _hasResolvedParams(urlOptions: Record<string, unknown>): boolean {
        let hasResolvedParam: boolean = false;
        for (const i in urlOptions) {
            if (urlOptions.hasOwnProperty(i) && urlOptions[i] !== undefined) {
                hasResolvedParam = true;
                break;
            }
        }
        return hasResolvedParam;
    }

    private _fillUrlOptionsFromOptions(options: IRouteProps & Record<string, unknown>): void {
        for (const i in options) {
            if (
                options.hasOwnProperty(i) &&
                !this._isFilteredOptionName(i) &&
                !this._urlOptions.hasOwnProperty(i)
            ) {
                this._urlOptions[i] = options[i];
            }
        }
    }

    private _checkUrlResolved(): void {
        const _router = this.Router;
        const stateUrl = _router.url.getStateUrl();
        const urlOptions: Record<string, unknown> = _router.maskResolver.calculateUrlParams(
            this.props.mask,
            stateUrl
        );
        const hasResolvedParam: boolean = this._hasResolvedParams(urlOptions);
        this._fillUrlOptionsFromOptions(this.props);

        const currentState: IHistoryState = _router.history.getCurrentState();
        let prevState: IHistoryState = _router.history.getPrevState();
        if (hasResolvedParam) {
            if (this._didOptionsChange(urlOptions, this._urlOptions)) {
                this._setUrlOptions(urlOptions);
            }
            this._isResolved = true;
            if (!prevState) {
                prevState = {
                    state: _router.maskResolver.calculateHref(this.props.mask, { clear: true }),
                };
            }
            // @ts-ignore
            this.props.onEnter?.call(this, currentState, prevState);
            // @ts-ignore
            this.props.onUrlChange?.call(this, this._urlOptions, {});
        }
    }

    private _setUrlOptions(newUrlOptions: Record<string, unknown>): void {
        this._urlOptions = newUrlOptions;
        this._urlOptionsFields = Object.keys(newUrlOptions);
    }

    private _isFilteredOptionName(optionName: string): boolean {
        return FILTERED_OPTIONS_NAMES.indexOf(optionName) >= 0;
    }

    private _didOptionsChange(
        newOptions: Record<string, unknown>,
        oldOptions: Record<string, unknown>
    ): boolean {
        let i: string;

        for (i in newOptions) {
            if (newOptions.hasOwnProperty(i)) {
                if (!oldOptions.hasOwnProperty(i) || newOptions[i] !== oldOptions[i]) {
                    return true;
                }
            }
        }
        for (i in oldOptions) {
            if (
                oldOptions.hasOwnProperty(i) &&
                // проверка только полей опции, т.к. в старом _urlOptions есть поля типа vdomCORE, _$createdFromCode
                // а в новом _urlOptions этих полей нет и быть не может
                (this._urlOptionsFields.length === 0 || this._urlOptionsFields.indexOf(i) >= 0) &&
                !newOptions.hasOwnProperty(i)
            ) {
                return true;
            }
        }

        return false;
    }

    static contextType: typeof RouterContext = RouterContext;

    static displayName: string = 'Router/router:Route';
}

export { Route };

/**
 * @private
 */
export interface IRouteWrapperProps extends IRouteProps {
    /**
     * Временное поле для того, чтобы работал костыль в Page/base:Controller
     * TODO https://online.sbis.ru/opendoc.html?guid=ce230785-636a-47c3-9a9c-96460a7138d9&client=3
     */
    instanceRef?: Ref<Route>;
}

/**
 * Обертка над {@link Router/router:BaseRoute} для того, чтобы для него всегда в {@link Router/router:Context контексте} был Router.
 */
const RouteWrapper = forwardRef(function RouteWrapper(
    props: IRouteWrapperProps,
    ref: Ref<HTMLElement>
): ReactElement<IRouteWrapperProps, JSXElementConstructor<Route>> {
    const Router = useContext(RouterContext);
    const context = useContext(getWasabyContext());

    if (context.Router && (!Router || context.Router.instId > Router.instId)) {
        return (
            <ContextProvider Router={context.Router}>
                <Route {...props} forwardedRef={ref} ref={props.instanceRef} />
            </ContextProvider>
        );
    }
    return <Route {...props} forwardedRef={ref} ref={props.instanceRef} />;
});

RouteWrapper.displayName = `wrapToContext(${Route.displayName})`;

export default RouteWrapper;
