import * as React from 'react';
import type { ElementProps, FloatingContext, FloatingTreeType, ReferenceType } from '../types';
export interface HandleCloseFn<RT extends ReferenceType = ReferenceType> {
    (context: FloatingContext<RT> & {
        onClose: () => void;
        tree?: FloatingTreeType<RT> | null;
        leave?: boolean;
    }): (event: MouseEvent) => void;
    __options: {
        blockPointerEvents: boolean;
    };
}
export declare function getDelay(value: Props['delay'], prop: 'open' | 'close', pointerType?: PointerEvent['pointerType']): number | undefined;
export interface Props<RT extends ReferenceType = ReferenceType> {
    enabled?: boolean;
    handleClose?: HandleCloseFn<RT> | null;
    restMs?: number;
    delay?: number | Partial<{
        open: number;
        close: number;
    }>;
    mouseOnly?: boolean;
    move?: boolean;
}
/**
 * Opens the floating element while hovering over the reference element, like
 * CSS `:hover`.
 * @see https://floating-ui.com/docs/useHover
 */
export declare const useHover: <RT extends ReferenceType = ReferenceType>(context: {
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
}, { enabled, delay, handleClose, mouseOnly, restMs, move, }?: Props<RT>) => ElementProps;
