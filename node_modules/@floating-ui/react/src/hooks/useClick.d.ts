import * as React from 'react';
import type { ElementProps, FloatingContext, ReferenceType } from '../types';
export interface Props {
    enabled?: boolean;
    event?: 'click' | 'mousedown';
    toggle?: boolean;
    ignoreMouse?: boolean;
    keyboardHandlers?: boolean;
}
/**
 * Opens or closes the floating element when clicking the reference element.
 * @see https://floating-ui.com/docs/useClick
 */
export declare const useClick: <RT extends ReferenceType = ReferenceType>({ open, onOpenChange, dataRef, elements: { domReference } }: {
    x: number | null;
    y: number | null;
    placement: import("@floating-ui/core/src/types").Placement;
    strategy: import("@floating-ui/core/src/types").Strategy;
    middlewareData: import("@floating-ui/core/src/types").MiddlewareData;
    reference: (node: RT | null) => void;
    floating: (node: HTMLElement | null) => void;
    isPositioned: boolean;
    update: () => void;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    events: import("../types").FloatingEvents;
    dataRef: React.MutableRefObject<import("../types").ContextData>;
    nodeId: string | undefined;
    refs: import("../types").ExtendedRefs<RT>;
    elements: import("../types").ExtendedElements<RT>;
}, { enabled, event: eventOption, toggle, ignoreMouse, keyboardHandlers, }?: Props) => ElementProps;
