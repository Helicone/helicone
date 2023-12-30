import * as React from 'react';
import type { ElementProps, FloatingContext, ReferenceType } from '../types';
export interface Props {
    listRef: React.MutableRefObject<Array<string | null>>;
    activeIndex: number | null;
    onMatch?: (index: number) => void;
    enabled?: boolean;
    findMatch?: null | ((list: Array<string | null>, typedString: string) => string | null | undefined);
    resetMs?: number;
    ignoreKeys?: Array<string>;
    selectedIndex?: number | null;
}
/**
 * Provides a matching callback that can be used to focus an item as the user
 * types, often used in tandem with `useListNavigation()`.
 * @see https://floating-ui.com/docs/useTypeahead
 */
export declare const useTypeahead: <RT extends ReferenceType = ReferenceType>({ open, dataRef, refs }: {
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
}, { listRef, activeIndex, onMatch: unstable_onMatch, enabled, findMatch, resetMs, ignoreKeys, selectedIndex, }?: Props) => ElementProps;
