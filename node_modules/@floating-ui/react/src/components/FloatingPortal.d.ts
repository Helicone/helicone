import * as React from 'react';
import { FloatingContext } from '../types';
type FocusManagerState = (FloatingContext & {
    modal: boolean;
    closeOnFocusOut: boolean;
}) | null;
export declare const useFloatingPortalNode: ({ id, enabled, }?: {
    id?: string | undefined;
    enabled?: boolean | undefined;
}) => HTMLElement | null;
/**
 * Portals the floating element into a given container element — by default,
 * outside of the app root and into the body.
 * @see https://floating-ui.com/docs/FloatingPortal
 */
export declare const FloatingPortal: ({ children, id, root, preserveTabOrder, }: {
    children?: React.ReactNode;
    id?: string | undefined;
    root?: HTMLElement | null | undefined;
    preserveTabOrder?: boolean | undefined;
}) => JSX.Element;
export declare const usePortalContext: () => {
    preserveTabOrder: boolean;
    portalNode: HTMLElement | null;
    setFocusManagerState: React.Dispatch<React.SetStateAction<FocusManagerState>>;
    beforeInsideRef: React.RefObject<HTMLSpanElement>;
    afterInsideRef: React.RefObject<HTMLSpanElement>;
    beforeOutsideRef: React.RefObject<HTMLSpanElement>;
    afterOutsideRef: React.RefObject<HTMLSpanElement>;
} | null;
export {};
