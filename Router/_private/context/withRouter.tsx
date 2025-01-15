import { Component, ComponentType } from 'react';
import Context from './Context';

/**
 * Принимает компонент и возвращает обёртку над ним, которая получает Router из контекста и передаёт в опции.
 * Нужно использовать в тех случаях, когда в Wasaby-контроле или чистом реактовском классе нужен Router.
 * Для функциональных компонентов лучше пользоваться хуком {@link Router/router:useRouter}.
 * @public
 * @param WrappedComponent Компонент, который нужно обернуть.
 */
export function withRouter<T extends ComponentType>(WrappedComponent: T): T {
    const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';

    class ComponentWithRouter extends Component<any, any> {
        _$child: any;
        constructor(props: any) {
            super(props);
            this.ref = this.ref.bind(this);
        }
        ref(node: any) {
            this._$child = node;
        }
        render() {
            return (
                // @ts-ignore
                <WrappedComponent {...this.props} ref={this.ref} Router={this.context} />
            );
        }
        static readonly contextType: typeof Context = Context;
        static displayName: string = `withRouter(${displayName})`;
    }

    // многие задают этот метод для установки опций по умолчанию, этот метод используется в попапах для получения опций
    // @ts-ignore
    ComponentWithRouter.getDefaultOptions = WrappedComponent.getDefaultOptions;
    // @ts-ignore
    ComponentWithRouter._getDefaultOptions = WrappedComponent._getDefaultOptions;
    // альтернативный, правильный с точки зрения реакта способ задания опций по умолчанию
    // @ts-ignore
    ComponentWithRouter.defaultProps = WrappedComponent.defaultProps;
    // @ts-ignore
    ComponentWithRouter.getOptionTypes = WrappedComponent.getOptionTypes;
    // статическое поле для задания стилей
    // @ts-ignore
    ComponentWithRouter._styles = WrappedComponent._styles;

    // @ts-ignore
    return ComponentWithRouter;
}
