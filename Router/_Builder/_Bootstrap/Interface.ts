import { AdaptiveModeType } from 'UI/Adaptive';

/**
 * @private
 * @property HeadAPIData         - данные из HeadAPI. Строка вида HTML.
 * @property BodyAPIClasses      - данные из BodyAPI. Строка с классами для <body>.
 * @property JSLinksAPIBaseData  - данные из JSLinksAPI, но с базовыми скриптами. Строка вида HTML.
 * @property JSLinksAPIData      - данные из JSLinksAPI со всеми остальными скриптами. Строка вида HTML.
 * @property requiredModules   - массив с именами доп. зависимостей. Они нужны непосредственно для старта.
 * @property controlsHTML        - стррока вида HTML с версткой контролов, полученная на первом шаге.
 * @property isCanceledRevive - отмена оживления страницы на клиенте
 * @property prerender - https://online.sbis.ru/opendoc.html?guid=9a500336-5855-4d08-9c69-b27a54ff2e37
 */
export interface IFullData {
    HeadAPIData: string;
    BodyAPIClasses?: string;
    JSLinksAPIBaseData?: string;
    JSLinksAPIData?: string;
    JSLinksAPITimeTesterData?: string;

    requiredModules?: string[];
    controlsHTML: string;

    // направление текста на странице - ltr или rtl
    directionality: string;

    // время старта построения страницы, в миллисекундах
    renderStartTime?: number;

    // поля при генерации статичной странички в билдере
    builderOptions?: IBuilderOptions;
    isCanceledRevive?: boolean;
    prerender: boolean;
}

/**
 * @private
 */
export interface IPageConfig {
    title?: string;
    favicon?: string;
    getDataToRender?: boolean;
    error?: unknown;
    /**
     * В случае, когда из метода getDataTorender делают redirect на другой url-адрес
     * необходимо остановить рендер страницы.
     * Поэтому в результате метода getDataToRender необходимо вернуть это поле со значением true.
     */
    stopRender?: boolean;
}

/**
 * @private
 */
export interface IRenderOptions {
    appRoot: string;
    wsRoot: string;
    resourceRoot: string;
    metaRoot?: string;
    cdnRoot?: string;
    staticDomains: string[];
    logLevel?: string;
    servicesPath: string;
    buildnumber?: string;
    product?: string;
    pageName?: string;
    theme?: string;
    RUMEnabled?: boolean;
    application?: string;
    /**
     * Поле, в котором будут лежать предзагруженные данные для построения страницы
     */
    pageConfig: IPageConfig | false;
    _options?: IBuilderOptions;
    isCanceledRevive?: boolean;
    prerender?: boolean;
    // время старта построения страницы, в миллисекундах
    renderStartTime?: number;
    // контекстно-зависимый инстанс методов роутера (maskResolver, urlRewriter, navigate, ...)
    Router: unknown;
    isAdaptive?: boolean;
    adaptiveMode: AdaptiveModeType;
}

/**
 * @private
 */
export interface IBuilderExtraInfo {
    topLevelComponentName: string;
    bundlesRoute: Record<string, string>;
    moduleDependencies: {
        links: Record<string, string[]>;
        nodes: Record<string, { path: string; amd?: boolean }>;
    };
}

/**
 * поля при генерации статичной странички в билдере
 * @private
 */
export interface IBuilderOptions {
    builder: string;
    builderCompatible: boolean;
    dependencies: string[];
    extraInfo?: IBuilderExtraInfo;
    buildFull?: boolean;
}

/**
 * @private
 */
export interface ICollectedDeps {
    // названия js модулей
    js: string[];
    css: {
        simpleCss: string[];
        themedCss: string[];
    };
    tmpl: string[];
    wml: string[];
    rsSerialized: string;
    requiredModules: string[];
}

/**
 * @private
 */
export interface IDataAggregatorModule {
    execute(options: IRenderOptions, deps: ICollectedDeps): Partial<IFullData> | null;
}
