import { createContext } from 'react';
import { IRouter } from '../Router/Router';

//@ts-ignore
const defaultValue: IRouter = undefined;

/**
 * Контекст для работы с методами Router
 * @see Router/router:IRouter
 * @public
 */
const Context = createContext<IRouter>(defaultValue);

Context.displayName = 'Router/router:Context';

export default Context;
