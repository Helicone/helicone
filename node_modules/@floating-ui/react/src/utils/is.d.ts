export declare function isElement(value: any): value is Element;
export declare function isHTMLElement(value: any): value is HTMLElement;
export declare function isShadowRoot(node: Node): node is ShadowRoot;
export declare function isVirtualClick(event: MouseEvent | PointerEvent): boolean;
export declare function isVirtualPointerEvent(event: PointerEvent): boolean;
export declare function isSafari(): boolean;
export declare function isMac(): boolean;
export declare function isMouseLikePointerType(pointerType: string | undefined, strict?: boolean): boolean;
