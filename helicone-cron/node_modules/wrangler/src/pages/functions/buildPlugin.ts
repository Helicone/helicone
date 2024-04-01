import { access, lstat } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import { bundleWorker } from "../../bundle";
import { getBasePath } from "../../paths";
import { D1_BETA_PREFIX } from "../../worker";
import type { Options as WorkerOptions } from "./buildWorker";

type Options = Omit<WorkerOptions, "fallbackService" | "buildOutputDirectory">;

export function buildPlugin({
	routesModule,
	outfile = "bundle.js",
	minify = false,
	sourcemap = false,
	watch = false,
	onEnd = () => {},
	nodeCompat,
	functionsDirectory,
	local,
	betaD1Shims,
}: Options) {
	return bundleWorker(
		{
			file: resolve(getBasePath(), "templates/pages-template-plugin.ts"),
			directory: functionsDirectory,
			format: "modules",
		},
		resolve(outfile),
		{
			inject: [routesModule],
			minify,
			sourcemap,
			watch,
			nodeCompat,
			define: {},
			betaD1Shims: (betaD1Shims || []).map(
				(binding) => `${D1_BETA_PREFIX}${binding}`
			),
			plugins: [
				{
					name: "wrangler notifier and monitor",
					setup(pluginBuild) {
						pluginBuild.onEnd((result) => {
							if (result.errors.length > 0) {
								console.error(
									`${result.errors.length} error(s) and ${result.warnings.length} warning(s) when compiling Worker.`
								);
							} else if (result.warnings.length > 0) {
								console.warn(
									`${result.warnings.length} warning(s) when compiling Worker.`
								);
								onEnd();
							} else {
								console.log("Compiled Worker successfully.");
								onEnd();
							}
						});
					},
				},
				{
					name: "Assets",
					setup(pluginBuild) {
						if (pluginBuild.initialOptions.outfile) {
							const outdir = dirname(pluginBuild.initialOptions.outfile);

							pluginBuild.onResolve({ filter: /^assets:/ }, async (args) => {
								const directory = resolve(
									args.resolveDir,
									args.path.slice("assets:".length)
								);

								const exists = await access(directory)
									.then(() => true)
									.catch(() => false);

								const isDirectory =
									exists && (await lstat(directory)).isDirectory();

								if (!isDirectory) {
									return {
										errors: [
											{
												text: `'${directory}' does not exist or is not a directory.`,
											},
										],
									};
								}

								const path = `assets:./${relative(outdir, directory)}`;

								return { path, external: true, namespace: "assets" };
							});
						}
					},
				},
			],
			isOutfile: true,
			serveAssetsFromWorker: false,
			disableModuleCollection: true,
			rules: [],
			checkFetch: local,
			targetConsumer: local ? "dev" : "publish",
			local,
			experimentalLocal: false,
		}
	);
}
