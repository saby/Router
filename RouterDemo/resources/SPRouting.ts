/**
 * @author Мустафин Л.И.
 */

// @ts-ignore
import { Control, TemplateFunction } from 'UI/Base';
// @ts-ignore
import template = require('wml!RouterDemo/resources/SPRouting');

/**
 * Пример SPA-перехода для переключения между вкладками {@link RouterDemo/resources/TabsBlock}
 * с использованием {@link Router.Route} и {@link Router.Reference}
 */
class SPRouting extends Control {
    protected _template: TemplateFunction = template;
}

export default SPRouting;
