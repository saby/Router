/**
 * Интерфейс класса реализующего API работы с router.json.
 * @public
 * @author Мустафин Л.И.
 */
export interface IUrlRewriter {
    /**
     * Модифицирует переданный URL, заменяя его префикс на основе конфигурации, указанной
     * в файле router.json (ключ -> значение)
     * @param originalUrl URL для модификации
     * @returns модифицированный URL
     */
    get(originalUrl: string): string | undefined;
    /**
     * Отменяет модификацию URL-адреса, возвращая его в исходный вид, заменяя префикс на исходный,
     * на основе конфигурации в файле router.json (значение -> ключ)
     * @param rewrittenUrl URL для восстановления
     * @returns исходный URL
     */
    getReverse(rewrittenUrl: string): string | undefined;
}
