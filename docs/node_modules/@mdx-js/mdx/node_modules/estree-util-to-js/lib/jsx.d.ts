export namespace jsx {
  export {JSXAttribute}
  export {JSXClosingElement}
  export {JSXClosingFragment}
  export {JSXElement}
  export {JSXEmptyExpression}
  export {JSXExpressionContainer}
  export {JSXFragment}
  export {JSXIdentifier}
  export {JSXMemberExpression}
  export {JSXNamespacedName}
  export {JSXOpeningElement}
  export {JSXOpeningFragment}
  export {JSXSpreadAttribute}
  export {JSXText}
}
export type JSXAttribute = import('estree-jsx').JSXAttribute
export type JSXClosingElement = import('estree-jsx').JSXClosingElement
export type JSXClosingFragment = import('estree-jsx').JSXClosingFragment
export type JSXElement = import('estree-jsx').JSXElement
export type JSXExpressionContainer = import('estree-jsx').JSXExpressionContainer
export type JSXFragment = import('estree-jsx').JSXFragment
export type JSXIdentifier = import('estree-jsx').JSXIdentifier
export type JSXMemberExpression = import('estree-jsx').JSXMemberExpression
export type JSXNamespacedName = import('estree-jsx').JSXNamespacedName
export type JSXOpeningElement = import('estree-jsx').JSXOpeningElement
export type JSXOpeningFragment = import('estree-jsx').JSXOpeningFragment
export type JSXSpreadAttribute = import('estree-jsx').JSXSpreadAttribute
export type JSXText = import('estree-jsx').JSXText
export type Generator = import('./types.js').Generator
export type State = import('./types.js').State
/**
 * `attr`
 * `attr="something"`
 * `attr={1}`
 *
 * @this {Generator}
 *   `astring` generator.
 * @param {JSXAttribute} node
 *   Node to serialize.
 * @param {State} state
 *   Info passed around.
 * @returns {void}
 *   Nothing.
 */
declare function JSXAttribute(
  this: import('./types.js').Generator,
  node: JSXAttribute,
  state: State
): void
/**
 * `</div>`
 *
 * @this {Generator}
 *   `astring` generator.
 * @param {JSXClosingElement} node
 *   Node to serialize.
 * @param {State} state
 *   Info passed around.
 * @returns {void}
 *   Nothing.
 */
declare function JSXClosingElement(
  this: import('./types.js').Generator,
  node: JSXClosingElement,
  state: State
): void
/**
 * `</>`
 *
 * @this {Generator}
 *   `astring` generator.
 * @param {JSXClosingFragment} node
 *   Node to serialize.
 * @param {State} state
 *   Info passed around.
 * @returns {void}
 *   Nothing.
 */
declare function JSXClosingFragment(
  this: import('./types.js').Generator,
  node: JSXClosingFragment,
  state: State
): void
/**
 * `<div />`
 * `<div></div>`
 *
 * @this {Generator}
 *   `astring` generator.
 * @param {JSXElement} node
 *   Node to serialize.
 * @param {State} state
 *   Info passed around.
 * @returns {void}
 *   Nothing.
 */
declare function JSXElement(
  this: import('./types.js').Generator,
  node: JSXElement,
  state: State
): void
/**
 * `{}` (always in a `JSXExpressionContainer`, which does the curlies)
 *
 * @this {Generator}
 *   `astring` generator.
 * @returns {void}
 *   Nothing.
 */
declare function JSXEmptyExpression(this: import('./types.js').Generator): void
/**
 * `{expression}`
 *
 * @this {Generator}
 *   `astring` generator.
 * @param {JSXExpressionContainer} node
 *   Node to serialize.
 * @param {State} state
 *   Info passed around.
 * @returns {void}
 *   Nothing.
 */
declare function JSXExpressionContainer(
  this: import('./types.js').Generator,
  node: JSXExpressionContainer,
  state: State
): void
/**
 * `<></>`
 *
 * @this {Generator}
 *   `astring` generator.
 * @param {JSXFragment} node
 *   Node to serialize.
 * @param {State} state
 *   Info passed around.
 * @returns {void}
 *   Nothing.
 */
declare function JSXFragment(
  this: import('./types.js').Generator,
  node: JSXFragment,
  state: State
): void
/**
 * `div`
 *
 * @this {Generator}
 *   `astring` generator.
 * @param {JSXIdentifier} node
 *   Node to serialize.
 * @param {State} state
 *   Info passed around.
 * @returns {void}
 *   Nothing.
 */
declare function JSXIdentifier(
  this: import('./types.js').Generator,
  node: JSXIdentifier,
  state: State
): void
/**
 * `member.expression`
 *
 * @this {Generator}
 *   `astring` generator.
 * @param {JSXMemberExpression} node
 *   Node to serialize.
 * @param {State} state
 *   Info passed around.
 * @returns {void}
 *   Nothing.
 */
declare function JSXMemberExpression(
  this: import('./types.js').Generator,
  node: JSXMemberExpression,
  state: State
): void
/**
 * `ns:name`
 *
 * @this {Generator}
 *   `astring` generator.
 * @param {JSXNamespacedName} node
 *   Node to serialize.
 * @param {State} state
 *   Info passed around.
 * @returns {void}
 *   Nothing.
 */
declare function JSXNamespacedName(
  this: import('./types.js').Generator,
  node: JSXNamespacedName,
  state: State
): void
/**
 * `<div>`
 *
 * @this {Generator}
 *   `astring` generator.
 * @param {JSXOpeningElement} node
 *   Node to serialize.
 * @param {State} state
 *   Info passed around.
 * @returns {void}
 *   Nothing.
 */
declare function JSXOpeningElement(
  this: import('./types.js').Generator,
  node: JSXOpeningElement,
  state: State
): void
/**
 * `<>`
 *
 * @this {Generator}
 *   `astring` generator.
 * @param {JSXOpeningFragment} node
 *   Node to serialize.
 * @param {State} state
 *   Info passed around.
 * @returns {void}
 *   Nothing.
 */
declare function JSXOpeningFragment(
  this: import('./types.js').Generator,
  node: JSXOpeningFragment,
  state: State
): void
/**
 * `{...argument}`
 *
 * @this {Generator}
 *   `astring` generator.
 * @param {JSXSpreadAttribute} node
 *   Node to serialize.
 * @param {State} state
 *   Info passed around.
 * @returns {void}
 *   Nothing.
 */
declare function JSXSpreadAttribute(
  this: import('./types.js').Generator,
  node: JSXSpreadAttribute,
  state: State
): void
/**
 * `!`
 *
 * @this {Generator}
 *   `astring` generator.
 * @param {JSXText} node
 *   Node to serialize.
 * @param {State} state
 *   Info passed around.
 * @returns {void}
 *   Nothing.
 */
declare function JSXText(
  this: import('./types.js').Generator,
  node: JSXText,
  state: State
): void
export {}
