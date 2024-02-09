/**
 * Transform a DOM tree to a hast tree.
 *
 * @param {Node} tree
 *   DOM tree to transform.
 * @param {Options | null | undefined} [options]
 *   Configuration (optional).
 * @returns {HastNodes}
 *   Equivalent hast node.
 */
export function fromDom(tree: Node, options?: Options | null | undefined): HastNodes;
export type HastComment = import('hast').Comment;
export type HastDoctype = import('hast').Doctype;
export type HastElement = import('hast').Element;
export type HastNodes = import('hast').Nodes;
export type HastRoot = import('hast').Root;
export type HastRootContent = import('hast').RootContent;
export type HastText = import('hast').Text;
/**
 * Callback called when each node is transformed.
 */
export type AfterTransform = (domNode: Node, hastNode: HastNodes) => undefined | void;
/**
 * Configuration.
 */
export type Options = {
    /**
     * Callback called when each node is transformed (optional).
     */
    afterTransform?: AfterTransform | null | undefined;
};
