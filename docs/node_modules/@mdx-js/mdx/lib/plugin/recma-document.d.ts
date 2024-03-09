export function recmaDocument(this: import("unified").Processor<void, import("estree").Program, void, void>, ...settings: [] | [RecmaDocumentOptions | null | undefined]): void | import("unified").Transformer<import("estree").Program, import("estree").Program>;
export type Directive = import('estree-jsx').Directive;
export type ExportAllDeclaration = import('estree-jsx').ExportAllDeclaration;
export type ExportDefaultDeclaration = import('estree-jsx').ExportDefaultDeclaration;
export type ExportNamedDeclaration = import('estree-jsx').ExportNamedDeclaration;
export type ExportSpecifier = import('estree-jsx').ExportSpecifier;
export type Expression = import('estree-jsx').Expression;
export type FunctionDeclaration = import('estree-jsx').FunctionDeclaration;
export type ImportDeclaration = import('estree-jsx').ImportDeclaration;
export type ImportDefaultSpecifier = import('estree-jsx').ImportDefaultSpecifier;
export type ImportExpression = import('estree-jsx').ImportExpression;
export type ImportSpecifier = import('estree-jsx').ImportSpecifier;
export type Literal = import('estree-jsx').Literal;
export type JSXElement = import('estree-jsx').JSXElement;
export type ModuleDeclaration = import('estree-jsx').ModuleDeclaration;
export type Node = import('estree-jsx').Node;
export type Program = import('estree-jsx').Program;
export type Property = import('estree-jsx').Property;
export type SimpleLiteral = import('estree-jsx').SimpleLiteral;
export type SpreadElement = import('estree-jsx').SpreadElement;
export type Statement = import('estree-jsx').Statement;
export type VariableDeclarator = import('estree-jsx').VariableDeclarator;
/**
 * Configuration for internal plugin `recma-document`.
 */
export type RecmaDocumentOptions = {
    /**
     * Whether to use either `import` and `export` statements to get the runtime
     * (and optionally provider) and export the content, or get values from
     * `arguments` and return things.
     */
    outputFormat?: 'function-body' | 'program' | null | undefined;
    /**
     * Whether to keep `import` (and `export … from`) statements or compile them
     * to dynamic `import()` instead.
     */
    useDynamicImport?: boolean | null | undefined;
    /**
     * Resolve `import`s (and `export … from`, and `import.meta.url`) relative to
     * this URL.
     */
    baseUrl?: string | null | undefined;
    /**
     * Pragma for JSX (used in classic runtime).
     */
    pragma?: string | null | undefined;
    /**
     * Pragma for JSX fragments (used in classic runtime).
     */
    pragmaFrag?: string | null | undefined;
    /**
     * Where to import the identifier of `pragma` from (used in classic runtime).
     */
    pragmaImportSource?: string | null | undefined;
    /**
     * Place to import automatic JSX runtimes from (used in automatic runtime).
     */
    jsxImportSource?: string | null | undefined;
    /**
     * JSX runtime to use.
     */
    jsxRuntime?: 'automatic' | 'classic' | null | undefined;
};
