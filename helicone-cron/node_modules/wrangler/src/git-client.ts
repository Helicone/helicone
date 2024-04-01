import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execa } from "execa";
import { findUp } from "find-up";
import semiver from "semiver";

/**
 * Check whether the given current working directory is within a git repository
 * by looking for a `.git` directory in this or an ancestor directory.
 */
export async function isInsideGitRepo(cwd: string) {
	const res = await findUp(".git", { cwd, type: "directory" });
	return res !== undefined;
}

/**
 * Check whether git is installed by trying to run it.
 *
 * @returns a `string` containing the version of git that's installed, or `null` if git isn't installed
 */
export async function getGitVersioon(): Promise<string | null> {
	try {
		const gitVersionExecutionResult = await execa("git", ["--version"]);
		if (gitVersionExecutionResult.exitCode !== 0) {
			return null;
		}

		const [gitVersion] =
			/\d+.\d+.\d+/.exec(gitVersionExecutionResult.stdout) || [];
		return gitVersion;
	} catch (err) {
		return null;
	}
}

/**
 * Initialize a new Worker project with a git repository.
 *
 * We want the branch to be called `main` but earlier versions of git do not support `--initial-branch`.
 * If that is the case then we just fallback to the default initial branch name.
 */
export async function initializeGit(cwd: string) {
	try {
		// Try to create the repository with the HEAD branch of `main`.
		await execa("git", ["init", "--initial-branch", "main"], {
			cwd,
		});
	} catch {
		// Unable to create the repo with a HEAD branch name, so just fall back to the default.
		await execa("git", ["init"], {
			cwd,
		});
	}
}

/**
 * Clone a repository into a given directory, optionally applying a given filter for a sparse checkout.
 * Note: this does NOT initialize a git repository, that must be done separately.
 *
 * @param remote the remote repository to clone
 * @param targetDirectory the directory to clone into
 * @param subdirectory optional, clone a subdirectory instead of the whole repo
 */
export async function cloneIntoDirectory(
	remote: string,
	targetDirectory: string,
	subdirectory?: string
) {
	const args = ["clone", "--depth", "1"];

	const gitVersion = await getGitVersioon();
	if (!gitVersion) {
		throw new Error("Failed to find git installation");
	}

	// sparse checkouts were added in git 2.26.0, and allow for...sparse...checkouts...
	// basically it means you can checkout only certain files/folders/etc. instead of
	// the whole repo. useful for monorepos that may, for example,
	// contain multiple wrangler templates
	const useSparseCheckout = subdirectory && semiver(gitVersion, "2.26.0") > -1;
	if (useSparseCheckout) {
		args.push("--filter=blob:none", "--sparse");
	}

	const tagIndex = remote.lastIndexOf("#");
	if (tagIndex === -1) {
		args.push(remote);
	} else {
		args.push("-b", remote.substring(tagIndex + 1));
		args.push(remote.substring(0, tagIndex));
	}

	// we first clone into a temporary directory so that if something goes wrong,
	// the user's filesystem isn't left in a messed-up state
	const tempDir = fs.mkdtempSync(
		path.join(os.tmpdir(), `wrangler-generate-repo-`)
	);
	args.push(tempDir);

	await execa("git", args);

	// if we can use sparse checkout, run it now.
	// otherwise, the entire repo was cloned anyway, so skip this step
	if (useSparseCheckout) {
		await execa("git", [`sparse-checkout`, `set`, subdirectory], {
			cwd: tempDir,
		});
	}

	const templatePath =
		subdirectory !== undefined ? path.join(tempDir, subdirectory) : tempDir;

	// cleanup: move the template to the target directory and delete `.git`
	try {
		fs.renameSync(templatePath, targetDirectory);
	} catch {
		throw new Error(`Failed to find "${subdirectory}" in ${remote}`);
	}
	fs.rmSync(path.join(targetDirectory, ".git"), {
		recursive: true,
		force: true,
	});
}
