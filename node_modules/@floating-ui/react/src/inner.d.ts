import * as React from 'react';
import type { DetectOverflowOptions, ElementProps, FloatingContext, Middleware, SideObject } from './types';
export interface InnerProps {
    listRef: React.MutableRefObject<Array<HTMLElement | null>>;
    index: number;
    onFallbackChange?: null | ((fallback: boolean) => void);
    offset?: number;
    overflowRef?: React.MutableRefObject<SideObject | null>;
    scrollRef?: React.MutableRefObject<HTMLElement | null>;
    minItemsVisible?: number;
    referenceOverflowThreshold?: number;
}
/**
 * Positions the floating element such that an inner element inside
 * of it is anchored to the reference element.
 * @see https://floating-ui.com/docs/inner
 */
export declare const inner: (props: InnerProps & Partial<DetectOverflowOptions>) => Middleware;
export interface UseInnerOffsetProps {
    enabled?: boolean;
    overflowRef: React.MutableRefObject<SideObject | null>;
    scrollRef?: React.MutableRefObject<HTMLElement | null>;
    onChange: (offset: number | ((offset: number) => number)) => void;
}
/**
 * Changes the `inner` middleware's `offset` upon a `wheel` event to
 * expand the floating element's height, revealing more list items.
 * @see https://floating-ui.com/docs/inner
 */
export declare const useInnerOffset: ({ open, elements }: FloatingContext, { enabled, overflowRef, scrollRef, onChange: unstable_onChange, }: UseInnerOffsetProps) => ElementProps;
