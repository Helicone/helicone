/// <reference types="react" />
export declare const getTabbableOptions: () => {
    readonly getShadowRoot: true;
    readonly displayCheck: "none" | "full";
};
export declare function getTabbableIn(container: HTMLElement, direction: 'next' | 'prev'): import("tabbable").FocusableElement;
export declare function getNextTabbable(): import("tabbable").FocusableElement;
export declare function getPreviousTabbable(): import("tabbable").FocusableElement;
export declare function isOutsideEvent(event: FocusEvent | React.FocusEvent, container?: Element): boolean;
export declare function disableFocusInside(container: HTMLElement): void;
export declare function enableFocusInside(container: HTMLElement): void;
