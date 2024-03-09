export function rehypeRecma(this: import("unified").Processor<void, import("hast").Root, void, void>, ...settings: [] | [Options | null | undefined]): void | import("unified").Transformer<import("hast").Root, import("estree").Program>;
export type Program = import('estree-jsx').Program;
export type Root = import('hast').Root;
/**
 * Specify casing to use for attribute names.
 *
 * HTML casing is for example `class`, `stroke-linecap`, `xml:lang`.
 * React casing is for example `className`, `strokeLinecap`, `xmlLang`.
 */
export type ElementAttributeNameCase = 'html' | 'react';
/**
 * Casing to use for property names in `style` objects.
 *
 * CSS casing is for example `background-color` and `-webkit-line-clamp`.
 * DOM casing is for example `backgroundColor` and `WebkitLineClamp`.
 */
export type StylePropertyNameCase = 'css' | 'dom';
/**
 * Configuration for internal plugin `rehype-recma`.
 */
export type Options = {
    /**
     * Specify casing to use for attribute names.
     *
     * This casing is used for hast elements, not for embedded MDX JSX nodes
     * (components that someone authored manually).
     */
    elementAttributeNameCase?: ElementAttributeNameCase | null | undefined;
    /**
     * Specify casing to use for property names in `style` objects.
     *
     * This casing is used for hast elements, not for embedded MDX JSX nodes
     * (components that someone authored manually).
     */
    stylePropertyNameCase?: StylePropertyNameCase | null | undefined;
};
