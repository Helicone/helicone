import * as React from 'react';
import type { ElementProps, FloatingContext, ReferenceType } from '../types';
export interface Props {
    enabled?: boolean;
    keyboardOnly?: boolean;
}
/**
 * Opens the floating element while the reference element has focus, like CSS
 * `:focus`.
 * @see https://floating-ui.com/docs/useFocus
 */
export declare const useFocus: <RT extends ReferenceType = ReferenceType>({ open, onOpenChange, dataRef, events, refs, elements: { floating, domReference }, }: {
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
}, { enabled, keyboardOnly }?: Props) => ElementProps;
