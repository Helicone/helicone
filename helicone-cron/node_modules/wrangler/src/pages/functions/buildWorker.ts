import { access, cp, lstat, rm } from "node:fs/promises";
import { join, resolve } from "node:path";
import { nanoid } from "nanoid";
import { bundleWorker } from "../../bundle";
import { getBasePath } from "../../paths";
import { D1_BETA_PREFIX } from "../../worker";

export type Options = {
	routesModule: string;
	outfile: string;
	minify?: boolean;
	sourcemap?: boolean;
	fallbackService?: string;
	watch?: boolean;
	onEnd?: () => void;
	buildOutputDirectory?: string;
	nodeCompat?: boolean;
	functionsDirectory: string;
	local: boolean;
	betaD1Shims?: string[];
};

export function buildWorker({
	routesModule,
	outfile = "bundle.js",
	minify = false,
	sourcemap = false,
	fallbackService = "ASSETS",
	watch = false,
	onEnd = () => {},
	buildOutputDirectory,
	nodeCompat,
	functionsDirectory,
	local,
	betaD1Shims,
}: Options) {
	return bundleWorker(
		{
			file: resolve(getBasePath(), "templates/pages-template-worker.ts"),
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
			loader: {
				".txt": "text",
				".html": "text",
			},
			define: {
				__FALLBACK_SERVICE__: JSON.stringify(fallbackService),
			},
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
						const identifiers = new Map<string, string>();

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

							// TODO: Consider hashing the contents rather than using a unique identifier every time?
							identifiers.set(directory, nanoid());
							if (!buildOutputDirectory) {
								console.warn(
									"You're attempting to import static assets as part of your Pages Functions, but have not specified a directory in which to put them. You must use 'wrangler pages dev <directory>' rather than 'wrangler pages dev -- <command>' to import static assets in Functions."
								);
							}
							return { path: directory, namespace: "assets" };
						});

						pluginBuild.onLoad(
							{ filter: /.*/, namespace: "assets" },
							async (args) => {
								const identifier = identifiers.get(args.path);

								if (buildOutputDirectory) {
									const staticAssetsOutputDirectory = join(
										buildOutputDirectory,
										"cdn-cgi",
										"pages-plugins",
										identifier as string
									);
									await rm(staticAssetsOutputDirectory, {
										force: true,
										recursive: true,
									});
									await cp(args.path, staticAssetsOutputDirectory, {
										force: true,
										recursive: true,
									});

									return {
										// TODO: Watch args.path for changes and re-copy when updated
										contents: `export const onRequest = ({ request, env, functionPath }) => {
                    const url = new URL(request.url)
                    const relativePathname = \`/\${url.pathname.split(functionPath)[1] || ''}\`.replace(/^\\/\\//, '/');
                    url.pathname = '/cdn-cgi/pages-plugins/${identifier}' + relativePathname
                    request = new Request(url.toString(), request)
                    return env.ASSETS.fetch(request)
                  }`,
									};
								}
							}
						);
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
