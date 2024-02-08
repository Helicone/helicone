/**
 * @typedef {import('../core.js').ProcessorOptions} ProcessorOptions
 *
 * @typedef RunnerOptions
 *   Configuration with JSX runtime.
 * @property {any} Fragment
 *   Symbol to use for fragments.
 * @property {any} [jsx]
 *   Function to generate an element with static children in production mode.
 * @property {any} [jsxs]
 *   Function to generate an element with dynamic children in production mode.
 * @property {any} [jsxDEV]
 *   Function to generate an element in development mode.
 * @property {any} [useMDXComponents]
 *   Function to get `MDXComponents` from context.
 *
 * @typedef {Omit<ProcessorOptions, 'jsx' | 'jsxImportSource' | 'jsxRuntime' | 'pragma' | 'pragmaFrag' | 'pragmaImportSource' | 'providerImportSource' | 'outputFormat'> } EvaluateProcessorOptions
 *   Compile configuration without JSX options for evaluation.
 *
 * @typedef {EvaluateProcessorOptions & RunnerOptions} EvaluateOptions
 *   Configuration for evaluation.
 */
/**
 * Split compiletime options from runtime options.
 *
 * @param {EvaluateOptions | null | undefined} options
 * @returns {{compiletime: ProcessorOptions, runtime: RunnerOptions}}
 */
export function resolveEvaluateOptions(options: EvaluateOptions | null | undefined): {
    compiletime: ProcessorOptions;
    runtime: RunnerOptions;
};
export type ProcessorOptions = import('../core.js').ProcessorOptions;
/**
 * Configuration with JSX runtime.
 */
export type RunnerOptions = {
    /**
     *  Symbol to use for fragments.
     */
    Fragment: any;
    /**
     * Function to generate an element with static children in production mode.
     */
    jsx?: any;
    /**
     * Function to generate an element with dynamic children in production mode.
     */
    jsxs?: any;
    /**
     * Function to generate an element in development mode.
     */
    jsxDEV?: any;
    /**
     * Function to get `MDXComponents` from context.
     */
    useMDXComponents?: any;
};
/**
 * Compile configuration without JSX options for evaluation.
 */
export type EvaluateProcessorOptions = Omit<ProcessorOptions, 'jsx' | 'jsxImportSource' | 'jsxRuntime' | 'pragma' | 'pragmaFrag' | 'pragmaImportSource' | 'providerImportSource' | 'outputFormat'>;
/**
 * Configuration for evaluation.
 */
export type EvaluateOptions = EvaluateProcessorOptions & RunnerOptions;
