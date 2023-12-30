import type { FocusableElement } from 'tabbable';
interface Options {
    preventScroll?: boolean;
    cancelPrevious?: boolean;
    sync?: boolean;
}
export declare function enqueueFocus(el: FocusableElement | null, options?: Options): void;
export {};
