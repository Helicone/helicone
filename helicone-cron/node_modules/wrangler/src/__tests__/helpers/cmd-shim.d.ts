/**
 * The typings file available at `@types/cmd-shim` are out of date.
 */
module "cmd-shim" {
	/**
	 *
	 * Create a cmd shim at `to` for the command line program at `from`.
	 *
	 */
	export default function cmdShim(from: string, to: string): Promise<void>;
}
