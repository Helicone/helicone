/**
 * @param {Schema} schema
 *   Schema to use.
 * @param {string} defaultTagName
 *   Default tag name.
 * @param {Array<string> | undefined} [caseSensitive]
 *   Case-sensitive tag names (default: `undefined`).
 * @returns
 *   `h`.
 */
export function createH(schema: Schema, defaultTagName: string, caseSensitive?: Array<string> | undefined): {
    (selector?: null | undefined, ...children: Child[]): Root;
    (selector: string, properties: Properties, ...children: Child[]): Element;
    (selector: string, ...children: Child[]): Element;
};
export type Element = import('hast').Element;
export type Nodes = import('hast').Nodes;
export type Root = import('hast').Root;
export type RootContent = import('hast').RootContent;
export type Info = import('property-information').Info;
export type Schema = import('property-information').Schema;
/**
 * Result from a `h` (or `s`) call.
 */
export type Result = Element | Root;
/**
 * Value for a CSS style field.
 */
export type StyleValue = number | string;
/**
 * Supported value of a `style` prop.
 */
export type Style = Record<string, StyleValue>;
/**
 * Primitive property value.
 */
export type PrimitiveValue = boolean | number | string | null | undefined;
/**
 * List of property values for space- or comma separated values (such as `className`).
 */
export type ArrayValue = Array<number | string>;
/**
 * Primitive value or list value.
 */
export type PropertyValue = (string | number)[] | PrimitiveValue;
/**
 * Acceptable value for element properties.
 */
export type Properties = {
    [property: string]: Style | PropertyValue;
};
/**
 * Primitive children, either ignored (nullish), or turned into text nodes.
 */
export type PrimitiveChild = number | string | null | undefined;
/**
 * List of children.
 */
export type ArrayChild = Array<(import("hast").Nodes | PrimitiveChild)[] | Nodes | PrimitiveChild>;
/**
 * List of children (deep).
 */
export type ArrayChildNested = Array<Nodes | PrimitiveChild>;
/**
 * Acceptable child value.
 */
export type Child = (import("hast").Nodes | PrimitiveChild | ArrayChildNested)[] | Nodes | PrimitiveChild;
