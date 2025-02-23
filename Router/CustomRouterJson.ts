/**
 * Интерфейс router.json файла
 */
interface IRouterJson {
    [key: string]: string;
}

/**
 * Метод получения "кастомного" router.json
 * Результат этого метода будет использован совместно с router.json сервиса
 * - сначала этот "кастомный" router.json, потом router.json
 * По умолчанию "кастомного" router.json нет
 */
function get(): IRouterJson | void {}

export { get, IRouterJson };
