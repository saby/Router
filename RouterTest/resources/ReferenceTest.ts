import { Reference } from 'Router/router';
import { Control, TemplateFunction } from 'UI/Base';
import template = require('wml!RouterTest/resources/ReferenceTest');

export default class ReferenceTest extends Control {
    protected _template: TemplateFunction = template;
    protected _location: string;

    updateLocation(location: string): void {
        this._location = location;
    }

    getChildReference(): Reference {
        return this._children.reference as Reference;
    }
}
