/**
 * Turn JSX in `tree` into function calls: `<x />` -> `h('x')`!
 *
 * ###### Algorithm
 *
 * In almost all cases, this utility is the same as the Babel plugin, except that
 * they work on slightly different syntax trees.
 *
 * Some differences:
 *
 * *   no pure annotations things
 * *   `this` is not a component: `<this>` -> `h('this')`, not `h(this)`
 * *   namespaces are supported: `<a:b c:d>` -> `h('a:b', {'c:d': true})`,
 *     which throws by default in Babel or can be turned on with `throwIfNamespace`
 * *   no `useSpread`, `useBuiltIns`, or `filter` options
 *
 * @template {Node} Tree
 *   Node type.
 * @param {Tree} tree
 *   Tree to transform (typically `Program`).
 * @param {Options | null | undefined} [options={}]
 *   Configuration (optional).
 * @returns {Tree}
 *   Given, modified, `tree`.
 */
export function buildJsx<Tree extends import('estree').Node>(
  tree: Tree,
  options?: Options | null | undefined
): Tree
export type Node = import('estree-jsx').Node
export type Expression = import('estree-jsx').Expression
export type ObjectExpression = import('estree-jsx').ObjectExpression
export type Property = import('estree-jsx').Property
export type ImportSpecifier = import('estree-jsx').ImportSpecifier
export type SpreadElement = import('estree-jsx').SpreadElement
export type MemberExpression = import('estree-jsx').MemberExpression
export type Literal = import('estree-jsx').Literal
export type Identifier = import('estree-jsx').Identifier
export type JSXAttribute = import('estree-jsx').JSXAttribute
export type JSXMemberExpression = import('estree-jsx').JSXMemberExpression
export type JSXNamespacedName = import('estree-jsx').JSXNamespacedName
export type JSXIdentifier = import('estree-jsx').JSXIdentifier
/**
 * How to transform JSX.
 */
export type Runtime = 'automatic' | 'classic'
/**
 * Configuration.
 *
 * > 👉 **Note**: you can also configure `runtime`, `importSource`, `pragma`,
 * > and `pragmaFrag` from within files through comments.
 */
export type Options = {
  /**
   * Choose the runtime.
   *
   * Comment form: `@jsxRuntime theRuntime`.
   */
  runtime?: Runtime | null | undefined
  /**
   * Place to import `jsx`, `jsxs`, `jsxDEV`, and `Fragment` from, when the
   * effective runtime is automatic.
   *
   * Comment form: `@jsxImportSource theSource`.
   *
   * > 👉 **Note**: `/jsx-runtime` or `/jsx-dev-runtime` is appended to this
   * > provided source.
   * > In CJS, that can resolve to a file (as in `theSource/jsx-runtime.js`),
   * > but for ESM an export map needs to be set up to point to files:
   * >
   * > ```js
   * > // …
   * > "exports": {
   * >   // …
   * >   "./jsx-runtime": "./path/to/jsx-runtime.js",
   * >   "./jsx-dev-runtime": "./path/to/jsx-runtime.js"
   * >   // …
   * > ```
   */
  importSource?: string | null | undefined
  /**
   * Identifier or member expression to call when the effective runtime is
   * classic.
   *
   * Comment form: `@jsx identifier`.
   */
  pragma?: string | null | undefined
  /**
   * Identifier or member expression to use as a symbol for fragments when the
   * effective runtime is classic.
   *
   * Comment form: `@jsxFrag identifier`.
   */
  pragmaFrag?: string | null | undefined
  /**
   * When in the automatic runtime, whether to import
   * `theSource/jsx-dev-runtime.js`, use `jsxDEV`, and pass location info when
   * available.
   *
   * This helps debugging but adds a lot of code that you don’t want in
   * production.
   */
  development?: boolean | null | undefined
  /**
   * File path to the original source file.
   *
   * Passed in location info to `jsxDEV` when using the automatic runtime with
   * `development: true`.
   */
  filePath?: string | null | undefined
}
/**
 * State where info from comments is gathered.
 */
export type Annotations = {
  /**
   * Runtime.
   */
  jsxRuntime?: Runtime | undefined
  /**
   * JSX identifier (`pragma`).
   */
  jsx?: string | undefined
  /**
   * JSX identifier of fragment (`pragmaFrag`).
   */
  jsxFrag?: string | undefined
  /**
   * Where to import an automatic JSX runtime from.
   */
  jsxImportSource?: string | undefined
}
/**
 * State of used identifiers from the automatic runtime.
 */
export type Imports = {
  /**
   * Symbol of `Fragment`.
   */
  fragment?: boolean | undefined
  /**
   * Symbol of `jsx`.
   */
  jsx?: boolean | undefined
  /**
   * Symbol of `jsxs`.
   */
  jsxs?: boolean | undefined
  /**
   * Symbol of `jsxDEV`.
   */
  jsxDEV?: boolean | undefined
}
