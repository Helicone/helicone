import * as React from 'react';
import type { ElementProps, FloatingContext, ReferenceType } from '../types';
export declare const normalizeBubblesProp: (bubbles?: boolean | {
    escapeKey?: boolean;
    outsidePress?: boolean;
}) => {
    escapeKeyBubbles: boolean;
    outsidePressBubbles: boolean;
};
export interface DismissPayload {
    type: 'outsidePress' | 'referencePress' | 'escapeKey' | 'mouseLeave';
    data: {
        returnFocus: boolean | {
            preventScroll: boolean;
        };
    };
}
export interface Props {
    enabled?: boolean;
    escapeKey?: boolean;
    referencePress?: boolean;
    referencePressEvent?: 'pointerdown' | 'mousedown' | 'click';
    outsidePress?: boolean | ((event: MouseEvent) => boolean);
    outsidePressEvent?: 'pointerdown' | 'mousedown' | 'click';
    ancestorScroll?: boolean;
    bubbles?: boolean | {
        escapeKey?: boolean;
        outsidePress?: boolean;
    };
}
/**
 * Closes the floating element when a dismissal is requested — by default, when
 * the user presses the `escape` key or outside of the floating element.
 * @see https://floating-ui.com/docs/useDismiss
 */
export declare const useDismiss: <RT extends ReferenceType = ReferenceType>({ open, onOpenChange, events, nodeId, elements: { reference, domReference, floating }, dataRef, }: {
    x: number | null;
    y: number | null;
    placement: import("@floating-ui/react-dom").Placement;
    strategy: import("@floating-ui/react-dom").Strategy;
    middlewareData: import("@floating-ui/react-dom").MiddlewareData;
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
}, { enabled, escapeKey, outsidePress: unstable_outsidePress, outsidePressEvent, referencePress, referencePressEvent, ancestorScroll, bubbles, }?: Props) => ElementProps;
