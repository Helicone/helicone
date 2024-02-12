/**
 * @typedef {import('estree-jsx').Declaration} Declaration
 * @typedef {import('estree-jsx').Expression} Expression
 */
/**
 * Turn a declaration into an expression.
 *
 * Doesn’t work for variable declarations, but that’s fine for our use case
 * because currently we’re using this utility for export default declarations,
 * which can’t contain variable declarations.
 *
 * @param {Declaration} declaration
 *   Declaration.
 * @returns {Expression}
 *   Expression.
 */
export function declarationToExpression(declaration: Declaration): Expression;
export type Declaration = import('estree-jsx').Declaration;
export type Expression = import('estree-jsx').Expression;
