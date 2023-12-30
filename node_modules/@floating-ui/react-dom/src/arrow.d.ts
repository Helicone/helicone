import type { Middleware, SideObject } from '@floating-ui/core';
import * as React from 'react';
export interface Options {
    element: React.MutableRefObject<Element | null> | Element;
    padding?: number | SideObject;
}
/**
 * A data provider that provides data to position an inner element of the
 * floating element (usually a triangle or caret) so that it is centered to the
 * reference element.
 * This wraps the core `arrow` middleware to allow React refs as the element.
 * @see https://floating-ui.com/docs/arrow
 */
export declare const arrow: (options: Options) => Middleware;
