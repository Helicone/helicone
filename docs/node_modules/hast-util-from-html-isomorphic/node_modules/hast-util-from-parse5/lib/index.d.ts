/**
 * Transform a `parse5` AST to hast.
 *
 * @param {P5Node} tree
 *   `parse5` tree to transform.
 * @param {Options | null | undefined} [options]
 *   Configuration (optional).
 * @returns {Nodes}
 *   hast tree.
 */
export function fromParse5(tree: P5Node, options?: Options | null | undefined): Nodes;
export type Element = import('hast').Element;
export type ElementData = import('hast').ElementData;
export type Nodes = import('hast').Nodes;
export type Root = import('hast').Root;
export type RootContent = import('hast').RootContent;
export type DefaultTreeAdapterMap = import('parse5').DefaultTreeAdapterMap;
export type P5ElementLocation = import('parse5').Token.ElementLocation;
export type P5Location = import('parse5').Token.Location;
export type Schema = import('property-information').Schema;
export type Point = import('unist').Point;
export type Position = import('unist').Position;
export type VFile = import('vfile').VFile;
export type P5Document = DefaultTreeAdapterMap['document'];
export type P5DocumentFragment = DefaultTreeAdapterMap['documentFragment'];
export type P5DocumentType = DefaultTreeAdapterMap['documentType'];
export type P5Comment = DefaultTreeAdapterMap['commentNode'];
export type P5Text = DefaultTreeAdapterMap['textNode'];
export type P5Element = DefaultTreeAdapterMap['element'];
export type P5Node = DefaultTreeAdapterMap['node'];
export type P5Template = DefaultTreeAdapterMap['template'];
/**
 * Configuration.
 */
export type Options = {
    /**
     * Which space the document is in (default: `'html'`).
     *
     * When an `<svg>` element is found in the HTML space, this package already
     * automatically switches to and from the SVG space when entering and exiting
     * it.
     */
    space?: Space | null | undefined;
    /**
     * File used to add positional info to nodes (optional).
     *
     * If given, the file should represent the original HTML source.
     */
    file?: VFile | null | undefined;
    /**
     * Whether to add extra positional info about starting tags, closing tags,
     * and attributes to elements (default: `false`).
     *
     * > 👉 **Note**: only used when `file` is given.
     */
    verbose?: boolean | null | undefined;
};
/**
 * Namespace.
 */
export type Space = 'html' | 'svg';
/**
 * Info passed around about the current state.
 */
export type State = {
    /**
     *   Corresponding file.
     */
    file: VFile | undefined;
    /**
     *   Whether location info was found.
     */
    location: boolean;
    /**
     *   Current schema.
     */
    schema: Schema;
    /**
     *   Add extra positional info.
     */
    verbose: boolean | undefined;
};
