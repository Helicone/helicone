import type {Program} from 'estree-jsx'
import type {Literal as HastLiteral} from 'hast'
import type {Literal as MdastLiteral} from 'mdast'

export {
  mdxExpressionFromMarkdown,
  mdxExpressionToMarkdown
} from './lib/index.js'

/**
 * MDX expression node, occurring in flow (block).
 */
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface MdxFlowExpression extends MdastLiteral {
  /**
   * Node type.
   */
  type: 'mdxFlowExpression'

  /**
   * Data.
   */
  data?: {
    /**
     * Program node from estree.
     */
    // eslint-disable-next-line @typescript-eslint/ban-types
    estree?: Program | null | undefined
  } & MdastLiteral['data']
}

/**
 * MDX expression node, occurring in text (phrasing).
 */
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface MdxTextExpression extends MdastLiteral {
  /**
   * Node type.
   */
  type: 'mdxTextExpression'

  /**
   * Data.
   */
  data?: {
    /**
     * Program node from estree.
     */
    // eslint-disable-next-line @typescript-eslint/ban-types
    estree?: Program | null | undefined
  } & MdastLiteral['data']
}

/**
 * Deprecated: use `MdxFlowExpression`.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export type MDXFlowExpression = MdxFlowExpression

/**
 * Deprecated: use `MdxTextExpression`.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export type MDXTextExpression = MdxTextExpression

/**
 * MDX expression node, occurring in flow (block), for hast.
 */
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface MdxFlowExpressionHast extends HastLiteral {
  /**
   * Node type.
   */
  type: 'mdxFlowExpression'

  /**
   * Data.
   */
  data?: {
    /**
     * Program node from estree.
     */
    // eslint-disable-next-line @typescript-eslint/ban-types
    estree?: Program | null | undefined
  } & HastLiteral['data']
}

/**
 * MDX expression node, occurring in text (phrasing), for hast.
 */
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface MdxTextExpressionHast extends HastLiteral {
  /**
   * Node type.
   */
  type: 'mdxTextExpression'

  /**
   * Data.
   */
  data?: {
    /**
     * Program node from estree.
     */
    // eslint-disable-next-line @typescript-eslint/ban-types
    estree?: Program | null | undefined
  } & HastLiteral['data']
}

// Add nodes to mdast content.
declare module 'mdast' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface StaticPhrasingContentMap {
    /**
     * MDX expression node, occurring in text (phrasing).
     */
    mdxTextExpression: MdxTextExpression
  }

  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface BlockContentMap {
    /**
     * MDX expression node, occurring in flow (block).
     */
    mdxFlowExpression: MdxFlowExpression
  }
}

// Add nodes to hast content.
declare module 'hast' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface RootContentMap {
    /**
     * MDX expression node, occurring in flow (block).
     */
    mdxFlowExpression: MdxFlowExpressionHast
    /**
     * MDX expression node, occurring in text (phrasing).
     */
    mdxTextExpression: MdxTextExpressionHast
  }

  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface ElementContentMap {
    /**
     * MDX expression node, occurring in flow (block).
     */
    mdxFlowExpression: MdxFlowExpressionHast
    /**
     * MDX expression node, occurring in text (phrasing).
     */
    mdxTextExpression: MdxTextExpressionHast
  }
}
