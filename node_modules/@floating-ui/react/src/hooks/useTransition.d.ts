import * as React from 'react';
import type { FloatingContext, Placement, ReferenceType, Side } from '../types';
export interface Props {
    duration?: number | Partial<{
        open: number;
        close: number;
    }>;
}
type Status = 'unmounted' | 'initial' | 'open' | 'close';
/**
 * Provides a status string to apply CSS transitions to a floating element,
 * correctly handling placement-aware transitions.
 * @see https://floating-ui.com/docs/useTransition#usetransitionstatus
 */
export declare function useTransitionStatus<RT extends ReferenceType = ReferenceType>({ open, elements: { floating } }: FloatingContext<RT>, { duration }?: Props): {
    isMounted: boolean;
    status: Status;
};
type CSSStylesProperty = React.CSSProperties | ((params: {
    side: Side;
    placement: Placement;
}) => React.CSSProperties);
export interface UseTransitionStylesProps extends Props {
    initial?: CSSStylesProperty;
    open?: CSSStylesProperty;
    close?: CSSStylesProperty;
    common?: CSSStylesProperty;
}
/**
 * Provides styles to apply CSS transitions to a floating element, correctly
 * handling placement-aware transitions. Wrapper around `useTransitionStatus`.
 * @see https://floating-ui.com/docs/useTransition#usetransitionstyles
 */
export declare function useTransitionStyles<RT extends ReferenceType = ReferenceType>(context: FloatingContext<RT>, { initial: unstable_initial, open: unstable_open, close: unstable_close, common: unstable_common, duration, }?: UseTransitionStylesProps): {
    isMounted: boolean;
    styles: React.CSSProperties;
};
export {};
