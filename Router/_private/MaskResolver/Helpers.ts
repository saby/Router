/**
 * Кодирует значения параметров url (пробелы, проценты и т.п.)
 * @param param
 */
export function encodeParam(param: unknown): string {
    const type:
        | 'string'
        | 'number'
        | 'bigint'
        | 'boolean'
        | 'symbol'
        | 'undefined'
        | 'object'
        | 'function' = typeof param;
    let result: unknown = param;
    if (type !== 'undefined') {
        if (type !== 'string') {
            // Convert parameter to string by calling JSON.stringify
            result = JSON.stringify(result);
        }
        result = encodeURIComponent(result as string);
    }
    return result as string;
}

/**
 * Раскодирует значения параметров из url (пробелы, проценты и т.п.)
 * @param param
 */
export function decodeParam(param: string): string {
    let result: string = param;
    if (typeof result !== 'undefined') {
        try {
            result = decodeURIComponent(result);
        } catch (e) {
            // If decoder throws an error, that means that the original
            // URL was malformed. If the user enters an invalid URL,
            // ignore the decoding (because it can't be decoded by the
            // browser) and return the string as is.
        }
    }
    return result;
}
