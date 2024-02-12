import type {Program} from 'estree-jsx'
import type {Literal as HastLiteral} from 'hast'
import type {Literal as MdastLiteral} from 'mdast'

export {mdxjsEsmFromMarkdown, mdxjsEsmToMarkdown} from './lib/index.js'

/**
 * MDX ESM (import/export) node.
 */
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface MdxjsEsm extends MdastLiteral {
  /**
   * Node type.
   */
  type: 'mdxjsEsm'

  /**
   * Data.
   */
  data?: {
    /**
     * Program node from estree.
     */
    // eslint-disable-next-line @typescript-eslint/ban-types
    estree?: Program | null | undefined
  }
}

/**
 * Deprecated: use the `MdxjsEsm` type instead.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export type MDXJSEsm = MdxjsEsm

/**
 * MDX ESM (import/export) node (for hast).
 */
// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
export interface MdxjsEsmHast extends HastLiteral {
  /**
   * Node type.
   */
  type: 'mdxjsEsm'

  /**
   * Data.
   */
  data?: {
    /**
     * Program node from estree.
     */
    // eslint-disable-next-line @typescript-eslint/ban-types
    estree?: Program | null | undefined
  }
}

// Add nodes to mdast content.
declare module 'mdast' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface FrontmatterContentMap {
    /**
     * MDX ESM.
     */
    mdxjsEsm: MdxjsEsm
  }
}

// Add nodes to hast content.
declare module 'hast' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface RootContentMap {
    /**
     * MDX ESM.
     */
    mdxjsEsm: MdxjsEsmHast
  }
}
