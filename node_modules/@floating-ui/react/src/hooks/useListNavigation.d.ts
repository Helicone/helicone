import * as React from 'react';
import type { ElementProps, FloatingContext, ReferenceType } from '../types';
export interface Props {
    listRef: React.MutableRefObject<Array<HTMLElement | null>>;
    activeIndex: number | null;
    onNavigate?: (index: number | null) => void;
    enabled?: boolean;
    selectedIndex?: number | null;
    focusItemOnOpen?: boolean | 'auto';
    focusItemOnHover?: boolean;
    openOnArrowKeyDown?: boolean;
    disabledIndices?: Array<number>;
    allowEscape?: boolean;
    loop?: boolean;
    nested?: boolean;
    rtl?: boolean;
    virtual?: boolean;
    orientation?: 'vertical' | 'horizontal' | 'both';
    cols?: number;
    scrollItemIntoView?: boolean | ScrollIntoViewOptions;
}
/**
 * Adds arrow key-based navigation of a list of items, either using real DOM
 * focus or virtual focus.
 * @see https://floating-ui.com/docs/useListNavigation
 */
export declare const useListNavigation: <RT extends ReferenceType = ReferenceType>({ open, onOpenChange, refs, elements: { domReference } }: {
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
}, { listRef, activeIndex, onNavigate: unstable_onNavigate, enabled, selectedIndex, allowEscape, loop, nested, rtl, virtual, focusItemOnOpen, focusItemOnHover, openOnArrowKeyDown, disabledIndices, orientation, cols, scrollItemIntoView, }?: Props) => ElementProps;
