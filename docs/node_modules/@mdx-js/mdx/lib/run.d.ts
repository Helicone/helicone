/**
 * Asynchronously run code.
 *
 * @param {{toString(): string}} file
 *   JS document to run.
 * @param {unknown} options
 *   Parameter.
 * @return {Promise<any>}
 *   Anthing.
 */
export function run(file: {
    toString(): string;
}, options: unknown): Promise<any>;
/**
 * Synchronously run code.
 *
 * @param {{toString(): string}} file
 *   JS document to run.
 * @param {unknown} options
 *   Parameter.
 * @return {any}
 *   Anthing.
 */
export function runSync(file: {
    toString(): string;
}, options: unknown): any;
