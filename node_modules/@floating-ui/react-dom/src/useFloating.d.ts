import type { ReferenceType, UseFloatingProps, UseFloatingReturn } from './types';
/**
 * Provides data to position a floating element.
 * @see https://floating-ui.com/docs/react
 */
export declare function useFloating<RT extends ReferenceType = ReferenceType>(options?: UseFloatingProps): UseFloatingReturn<RT>;
