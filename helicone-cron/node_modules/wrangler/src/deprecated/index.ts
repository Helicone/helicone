import fs from "node:fs";
import path from "node:path";
import { DeprecationError } from "../errors";
import { cloneIntoDirectory, initializeGit } from "../git-client";
import {
	CommandLineArgsError,
	createCLIParser,
	printWranglerBanner,
} from "../index";
import { initHandler } from "../init";
import { logger } from "../logger";
import { formatMessage } from "../parse";
import type {
	CommonYargsOptions,
	YargsOptionsToInterface,
} from "../yargs-types";
import type { Argv, ArgumentsCamelCase, BuilderCallback } from "yargs";

// https://github.com/cloudflare/wrangler/blob/master/src/cli/mod.rs#L106-L123
interface GenerateArgs {
	name?: string;
	template?: string;
	type?: string;
	site?: boolean;
}

export function generateOptions(yargs: Argv<CommonYargsOptions>) {
	return yargs
		.positional("name", {
			describe: "Name of the Workers project",
			type: "string",
		})
		.positional("template", {
			type: "string",
			describe: "The URL of a GitHub template",
		})
		.option("type", {
			alias: "t",
			type: "string",
			hidden: true,
			deprecated: true,
		})
		.option("site", {
			alias: "s",
			type: "boolean",
			hidden: true,
			deprecated: true,
		});
}

export async function generateHandler({
	// somehow, `init` marks name as required but then also runs fine
	// with the name omitted, and then substitutes it at runtime with ""
	name = "",
	template,
	type,
	site,
	...args
}: ArgumentsCamelCase<GenerateArgs>) {
	// delegate to `wrangler init` if no template is specified
	if (template === undefined) {
		return initHandler({ name, ...args });
	}

	// print down here cuz `init` prints it own its own
	await printWranglerBanner();

	if (type) {
		let message = "The --type option is no longer supported.";
		if (args.type === "webpack") {
			message +=
				"\nIf you wish to use webpack then you will need to create a custom build.";
			// TODO: Add a link to docs
		}
		throw new CommandLineArgsError(message);
	}

	if (isRemote(name)) {
		[template, name] = [name, template];
	}

	const creationDirectory = generateWorkerDirectoryName(name);

	if (site) {
		const gitDirectory =
			creationDirectory !== process.cwd()
				? path.basename(creationDirectory)
				: "my-site";
		const message =
			"The --site option is no longer supported.\n" +
			"If you wish to create a brand new Worker Sites project then clone the `worker-sites-template` starter repository:\n\n" +
			"```\n" +
			`git clone --depth=1 --branch=wrangler2 https://github.com/cloudflare/worker-sites-template ${gitDirectory}\n` +
			`cd ${gitDirectory}\n` +
			"```\n\n" +
			"Find out more about how to create and maintain Sites projects at https://developers.cloudflare.com/workers/platform/sites.\n" +
			"Have you considered using Cloudflare Pages instead? See https://pages.cloudflare.com/.";
		throw new CommandLineArgsError(message);
	}

	logger.log(
		`Creating a worker in ${path.basename(creationDirectory)} from ${template}`
	);

	const { remote, subdirectory } = parseTemplatePath(template);

	await cloneIntoDirectory(remote, creationDirectory, subdirectory);
	await initializeGit(creationDirectory);

	logger.log("✨ Success!");
}

/**
 * Creates a path based on the current working directory and a worker name.
 * Automatically increments a counter when searching for an available directory.
 *
 * Running `wrangler generate worker https://some-git-repo` in a directory
 * with the structure:
 * ```
 * - workers
 * |
 * | - worker
 * | | - wrangler.toml
 * | | ...
 * |
 * | - worker-1
 * | | - wrangler.toml
 * | | ...
 * ```
 *
 * will result in a new worker called `worker-2` being generated.
 *
 * @param workerName the name of the generated worker
 * @returns an absolute path to the directory to generate the worker into
 */
function generateWorkerDirectoryName(workerName: string): string {
	let workerDirectoryPath = path.resolve(process.cwd(), workerName);
	let i = 1;

	while (fs.existsSync(workerDirectoryPath)) {
		workerDirectoryPath = path.resolve(process.cwd(), `${workerName}-${i}`);
		i++;
	}

	return workerDirectoryPath;
}

/**
 * Checks if an arg is a template, which can be useful if the order
 * of template & worker name args is switched
 *
 * @param arg a template to generate from, or a folder to generate into
 * @returns true if the given arg was remote (a template)
 */
function isRemote(arg: string) {
	return /^(https?|ftps?|file|git|ssh):\/\//.test(arg) || arg.includes(":");
}

/**
 * unreadable regex basically copied from degit. i put some named capture groups in,
 * but uhh...there's not much to do short of using pomsky or some other tool.
 *
 * notably: this only supports `https://` and `git@` urls,
 * and is missing support for:
 * - `http`
 * - `ftp(s)`
 * - `file`
 * - `ssh`
 */
const TEMPLATE_REGEX =
	/^(?:(?:https:\/\/)?(?<httpsUrl>[^:/]+\.[^:/]+)\/|git@(?<gitUrl>[^:/]+)[:/]|(?<shorthandUrl>[^/]+):)?(?<user>[^/\s]+)\/(?<repository>[^/\s#]+)(?:(?<subdirectoryPath>(?:\/[^/\s#]+)+))?(?:\/)?(?:#(?<tag>.+))?/;

// there are a few URL formats we support:
// - `user/repo` -> assume github, use "https://github.com/user/repo.git"
// - `https://<httpsUrl>
// - `git@<gitUrl>`
// - `(bb|bitbucket|gh|github|gl|gitlab):user/repo` -> parse shorthand into https url

/**
 * There's no URL, so assume a github repo
 */
type NoUrl = {
	httpsUrl: undefined;
	gitUrl: undefined;
	shorthandUrl: undefined;
};

/**
 * A https url (e.g. https://bitbucket.org/user/repo)
 */
type HttpsUrl = Omit<NoUrl, "httpsUrl"> & { httpsUrl: string };

/**
 * A git url (e.g. git@gitlab.com:user/repo)
 */
type GitUrl = Omit<NoUrl, "gitUrl"> & { gitUrl: string };

/**
 * A shorthand url (e.g. github:user/repo)
 */
type ShorthandUrl = Omit<NoUrl, "shorthandUrl"> & { shorthandUrl: string };

/**
 * Union of all possible URL groups. Exactly one will be present, the rest
 * will be `undefined`.
 */
type TemplateRegexUrlGroup = NoUrl | HttpsUrl | GitUrl | ShorthandUrl;

/**
 * Possible matches of `TEMPLATE_REGEX` against a passed-in template arg
 */
type TemplateRegexGroups = {
	/** The user the repo is under */
	user: string;

	/** The repo name */
	repository: string;

	/** Optional, path to subdirectory containing template. Begins with `/` */
	subdirectoryPath?: string;

	/** Optional tag (or branch, etc.) to clone */
	tag?: string;
} & TemplateRegexUrlGroup;

/**
 * Parses a regex match on any of the URL groups into a URL base
 *
 * @param urlGroup a regex hit for a URL of any sort
 * @returns the protocol and domain name of the url to clone from
 */
function toUrlBase({ httpsUrl, gitUrl, shorthandUrl }: TemplateRegexUrlGroup) {
	if (httpsUrl !== undefined) {
		return `https://${httpsUrl}`;
	}

	if (gitUrl !== undefined) {
		return `git@${gitUrl}`;
	}

	if (shorthandUrl !== undefined) {
		switch (shorthandUrl) {
			case "github":
			case "gh":
				return "https://github.com";
			case "gitlab":
			case "gl":
				return "https://gitlab.com";
			case "bitbucket":
			case "bb":
				return "https://bitbucket.org";
			default:
				throw new Error(
					`Unable to parse shorthand ${shorthandUrl}. Supported options are "bitbucket" ("bb"), "github" ("gh"), and "gitlab" ("gl")`
				);
		}
	}

	return "https://github.com";
}

/**
 * Parses a template string (e.g. "user/repo", "github:user/repo/path/to/subdirectory")
 * into a remote URL to clone from and an optional subdirectory to filter for
 *
 * @param templatePath the template string to parse
 * @returns an object containing the remote url and an optional subdirectory to clone
 */
function parseTemplatePath(templatePath: string): {
	remote: string;
	subdirectory?: string;
} {
	if (!templatePath.includes("/")) {
		// template is a cloudflare canonical template, it doesn't include a slash in the name
		return {
			remote: "https://github.com/cloudflare/templates.git",
			subdirectory: templatePath,
		};
	}

	const groups = TEMPLATE_REGEX.exec(templatePath)?.groups as unknown as
		| TemplateRegexGroups
		| undefined;

	if (!groups) {
		throw new Error(`Unable to parse ${templatePath} as a template`);
	}

	const { user, repository, subdirectoryPath, tag, ...urlGroups } = groups;

	const urlBase = toUrlBase(urlGroups);
	const isHttp = urlBase.startsWith("http");

	const remote = `${urlBase}${isHttp ? "/" : ":"}${user}/${repository}.git${
		tag ? `#${tag}` : ""
	}`;

	// remove starting /
	const subdirectory = subdirectoryPath?.slice(1);

	return { remote, subdirectory };
}

export function buildOptions(yargs: Argv<CommonYargsOptions>) {
	return yargs;
}
type BuildArgs = YargsOptionsToInterface<typeof buildOptions>;
export async function buildHandler(buildArgs: BuildArgs) {
	// "[DEPRECATED] 🦀 Build your project (if applicable)",

	const envFlag = buildArgs.env ? ` --env=${buildArgs.env}` : "";
	logger.log(
		formatMessage({
			kind: "warning",
			text: "Deprecation: `wrangler build` has been deprecated.",
			notes: [
				{
					text: "Please refer to https://developers.cloudflare.com/workers/wrangler/migration/deprecations/#build for more information.",
				},
				{
					text: `Attempting to run \`wrangler publish --dry-run --outdir=dist${envFlag}\` for you instead:`,
				},
			],
		})
	);

	await createCLIParser([
		"publish",
		"--dry-run",
		"--outdir=dist",
		...(buildArgs.env ? ["--env", buildArgs.env] : []),
	]).parse();
}

export const noOpOptions = () => {};
export const configHandler = () => {
	// "🕵️  Authenticate Wrangler with a Cloudflare API Token",
	throw new DeprecationError(
		"`wrangler config` has been deprecated, please refer to https://developers.cloudflare.com/workers/wrangler/migration/deprecations/#config for alternatives"
	);
};

export function previewOptions(yargs: Argv<CommonYargsOptions>) {
	return yargs
		.positional("method", {
			type: "string",
			describe: "Type of request to preview your worker",
		})
		.positional("body", {
			type: "string",
			describe: "Body string to post to your preview worker request.",
		})
		.option("watch", {
			default: true,
			describe: "Enable live preview",
			type: "boolean",
		});
}

export function previewHandler() {
	throw new DeprecationError(
		"The `wrangler preview` command has been deprecated.\n" +
			"Try using `wrangler dev` to to try out a worker during development.\n"
	);
}

export const route: BuilderCallback<unknown, unknown> = (routeYargs: Argv) => {
	return routeYargs
		.command(
			"list",
			"List the routes associated with a zone",
			(yargs) => {
				return yargs
					.option("zone", {
						type: "string",
						requiresArg: true,
						describe: "Zone id",
					})
					.positional("zone", {
						describe: "Zone id",
						type: "string",
					});
			},
			() => {
				// "👯 [DEPRECATED]. Use wrangler.toml to manage routes.
				const deprecationNotice = "`wrangler route list` has been deprecated.";
				const futureRoutes =
					"Refer to wrangler.toml for a list of routes the worker will be deployed to upon publishing.";
				const presentRoutes =
					"Refer to the Cloudflare Dashboard to see the routes this worker is currently running on.";
				throw new DeprecationError(
					`${deprecationNotice}\n${futureRoutes}\n${presentRoutes}`
				);
			}
		)
		.command(
			"delete [id]",
			"Delete a route associated with a zone",
			(yargs) => {
				return yargs
					.positional("id", {
						describe: "The hash of the route ID to delete.",
						type: "string",
					})
					.option("zone", {
						type: "string",
						requiresArg: true,
						describe: "zone id",
					});
			},
			() => {
				// "👯 [DEPRECATED]. Use wrangler.toml to manage routes.
				const deprecationNotice =
					"`wrangler route delete` has been deprecated.";
				const shouldDo =
					"Remove the unwanted route(s) from wrangler.toml and run `wrangler publish` to remove your worker from those routes.";
				throw new DeprecationError(`${deprecationNotice}\n${shouldDo}`);
			}
		);
};

export const routeHandler = () => {
	// "[DEPRECATED]. Use wrangler.toml to manage routes.
	const deprecationNotice = "`wrangler route` has been deprecated.";
	const shouldDo =
		"Please use wrangler.toml and/or `wrangler publish --routes` to modify routes";
	throw new DeprecationError(`${deprecationNotice}\n${shouldDo}`);
};

export const subdomainOptions = (yargs: Argv<CommonYargsOptions>) => {
	return yargs.positional("name", { type: "string" });
};

export const subdomainHandler = () => {
	throw new DeprecationError(
		"`wrangler subdomain` has been deprecated, please refer to https://developers.cloudflare.com/workers/wrangler/migration/deprecations/#subdomain for alternatives"
	);
};
