export function recmaJsxRewrite(this: import("unified").Processor<void, import("estree").Program, void, void>, ...settings: [] | [RecmaJsxRewriteOptions | null | undefined]): void | import("unified").Transformer<import("estree").Program, import("estree").Program>;
export type Expression = import('estree-jsx').Expression;
export type EstreeFunction = import('estree-jsx').Function;
export type Identifier = import('estree-jsx').Identifier;
export type ImportSpecifier = import('estree-jsx').ImportSpecifier;
export type JSXElement = import('estree-jsx').JSXElement;
export type ModuleDeclaration = import('estree-jsx').ModuleDeclaration;
export type Node = import('estree-jsx').Node;
export type ObjectPattern = import('estree-jsx').ObjectPattern;
export type Program = import('estree-jsx').Program;
export type Property = import('estree-jsx').Property;
export type Statement = import('estree-jsx').Statement;
export type VariableDeclarator = import('estree-jsx').VariableDeclarator;
export type Scope = import('periscopic').Scope & {
    node: Node;
};
/**
 * Configuration for internal plugin `recma-jsx-rewrite`.
 */
export type RecmaJsxRewriteOptions = {
    /**
     * Whether to use an import statement or `arguments[0]` to get the provider.
     */
    outputFormat?: 'function-body' | 'program' | null | undefined;
    /**
     * Place to import a provider from.
     */
    providerImportSource?: string | null | undefined;
    /**
     * Whether to add extra info to error messages in generated code.
     *
     * This also results in the development automatic JSX runtime
     * (`/jsx-dev-runtime`, `jsxDEV`) being used, which passes positional info to
     * nodes.
     * The default can be set to `true` in Node.js through environment variables:
     * set `NODE_ENV=development`.
     */
    development?: boolean | null | undefined;
};
export type StackEntry = {
    objects: Array<string>;
    components: Array<string>;
    tags: Array<string>;
    references: Record<string, {
        node: JSXElement;
        component: boolean;
    }>;
    idToInvalidComponentName: Map<string | number, string>;
    node: EstreeFunction;
};
