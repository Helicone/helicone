/**
 * Create an automatic runtime.
 *
 * @param {ReturnType<CreateH>} f
 *   `h` function.
 * @returns
 *   Automatic JSX runtime.
 */
export function createAutomaticRuntime(f: ReturnType<CreateH>): {
    Fragment: null;
    jsx: {
        (type: null, props: {
            children?: Child;
        }, key?: string | undefined): Root;
        (type: string, props: JSXProps, key?: string | undefined): Element;
    };
    jsxDEV: {
        (type: null, props: {
            children?: Child;
        }, key?: string | undefined): Root;
        (type: string, props: JSXProps, key?: string | undefined): Element;
    };
    jsxs: {
        (type: null, props: {
            children?: Child;
        }, key?: string | undefined): Root;
        (type: string, props: JSXProps, key?: string | undefined): Element;
    };
};
export type Element = import('hast').Element;
export type Root = import('hast').Root;
export type Child = import('./create-h.js').Child;
export type Properties = import('./create-h.js').Properties;
export type PropertyValue = import('./create-h.js').PropertyValue;
export type Result = import('./create-h.js').Result;
export type Style = import('./create-h.js').Style;
export type CreateH = typeof import("./create-h.js").createH;
export type JSXProps = Record<string, Child | PropertyValue | Style>;
