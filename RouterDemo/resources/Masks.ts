/**
 * @author Мустафин Л.И.
 */

import { Control, TemplateFunction } from 'UI/Base';
import template = require('wml!RouterDemo/resources/Masks');

/**
 * Демонстрация query и fragment параметров в маске
 */

class Masks extends Control {
    protected _template: TemplateFunction = template;
}

export default Masks;
