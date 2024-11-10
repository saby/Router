/**
 * Библиотека single-page роутинга
 * Более подробно API роутинга описано по {@link /doc/platform/developmentapl/interface-development/routing/#router-api ссылке}
 * @library
 * @public
 * @author Мустафин Л.И.
 * @module
 */

import {
    getRootRouter,
    createNewRouter,
    IRouter,
} from './_private/Router/Router';
import initOnPopState from './_private/Router/InitOnPopState';
initOnPopState(getRootRouter);

import * as Controller from './_private/_deprecated/Controller';
import * as Data from './_private/_deprecated/Data';
import {
    IHistoryState,
    IRegisterableComponent,
    TStateChangeFunction,
    TOnChangeHistoryState,
} from './_private/DataInterfaces';
import { IRouterUrl } from './_private/Router/RouterUrl';
import { IMaskResolver } from './_private/MaskResolver';
import { IHistory } from './_private/History';
import * as History from './_private/_deprecated/History';
import * as MaskResolver from './_private/_deprecated/MaskResolver';
import { getAppNameByUrl } from './_private/MaskResolver';
import UrlRewriterClass, { IUrlRewriter } from './_private/UrlRewriter';

/**
 * @public
 */
export const UrlRewriter = UrlRewriterClass.getInstance();

import { default as Reference, IReferenceOptions, ISyntheticMouseEvent } from './_private/Reference';
import { default as Route, IRouteProps, TGetDataToRender, IProgressBar } from './_private/Route';

export {
    Controller,
    Data,
    History,
    MaskResolver,
    Reference,
    Route,
    getAppNameByUrl,
    getRootRouter,
    createNewRouter,
    IHistoryState,
    IRegisterableComponent,
    TStateChangeFunction,
    TOnChangeHistoryState,
    IRouter,
    IRouterUrl,
    IUrlRewriter,
    IMaskResolver,
    IHistory,
    IRouteProps,
    TGetDataToRender,
    IProgressBar,
    IReferenceOptions,
    ISyntheticMouseEvent,
    UrlRewriterClass,
};
