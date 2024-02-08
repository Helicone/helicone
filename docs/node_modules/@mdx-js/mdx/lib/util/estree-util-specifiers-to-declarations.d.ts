/**
 * @param {Array<ImportSpecifier | ImportDefaultSpecifier | ImportNamespaceSpecifier | ExportSpecifier>} specifiers
 * @param {Expression} init
 * @returns {Array<VariableDeclarator>}
 */
export function specifiersToDeclarations(specifiers: Array<ImportSpecifier | ImportDefaultSpecifier | ImportNamespaceSpecifier | ExportSpecifier>, init: Expression): Array<VariableDeclarator>;
export type AssignmentProperty = import('estree-jsx').AssignmentProperty;
export type ExportSpecifier = import('estree-jsx').ExportSpecifier;
export type Expression = import('estree-jsx').Expression;
export type Identifier = import('estree-jsx').Identifier;
export type ImportDefaultSpecifier = import('estree-jsx').ImportDefaultSpecifier;
export type ImportNamespaceSpecifier = import('estree-jsx').ImportNamespaceSpecifier;
export type ImportSpecifier = import('estree-jsx').ImportSpecifier;
export type VariableDeclarator = import('estree-jsx').VariableDeclarator;
