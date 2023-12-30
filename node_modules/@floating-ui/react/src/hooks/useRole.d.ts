import * as React from 'react';
import type { ElementProps, FloatingContext, ReferenceType } from '../types';
export interface Props {
    enabled?: boolean;
    role?: 'tooltip' | 'dialog' | 'alertdialog' | 'menu' | 'listbox' | 'grid' | 'tree';
}
/**
 * Adds base screen reader props to the reference and floating elements for a
 * given floating element `role`.
 * @see https://floating-ui.com/docs/useRole
 */
export declare const useRole: <RT extends ReferenceType = ReferenceType>({ open }: {
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
}, { enabled, role }?: Partial<Props>) => ElementProps;
