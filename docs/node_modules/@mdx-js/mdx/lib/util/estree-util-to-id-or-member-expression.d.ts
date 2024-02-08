/**
 * @param {Array<string | number>} ids
 * @returns {Identifier | MemberExpression}
 */
export function toIdOrMemberExpression(ids: Array<string | number>): Identifier | MemberExpression;
export function toJsxIdOrMemberExpression(ids: Array<string | number>): JSXIdentifier | JSXMemberExpression;
export type Identifier = import('estree-jsx').Identifier;
export type JSXIdentifier = import('estree-jsx').JSXIdentifier;
export type JSXMemberExpression = import('estree-jsx').JSXMemberExpression;
export type Literal = import('estree-jsx').Literal;
export type MemberExpression = import('estree-jsx').MemberExpression;
