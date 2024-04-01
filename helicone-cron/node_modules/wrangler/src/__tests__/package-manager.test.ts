import { writeFileSync } from "node:fs";
import { mockBinary } from "./helpers/mock-bin";
import { mockConsoleMethods } from "./helpers/mock-console";
import { runInTempDir } from "./helpers/run-in-tmp";

const { getPackageManager, getPackageManagerName } =
	jest.requireActual("../package-manager");
interface TestCase {
	npm: boolean;
	pnpm: boolean;
	yarn: boolean;
	npmLockFile: boolean;
	yarnLockFile: boolean;
	pnpmLockFile: boolean;
	expectedPackageManager: string;
}

const testCases: TestCase[] = [
	// npm binary only
	{
		npm: true,
		yarn: false,
		pnpm: false,
		npmLockFile: false,
		yarnLockFile: false,
		pnpmLockFile: false,
		expectedPackageManager: "npm",
	},
	{
		npm: true,
		yarn: false,
		pnpm: false,
		npmLockFile: true,
		yarnLockFile: false,
		pnpmLockFile: false,
		expectedPackageManager: "npm",
	},
	{
		npm: true,
		yarn: false,
		pnpm: false,
		npmLockFile: false,
		yarnLockFile: true,
		pnpmLockFile: false,
		expectedPackageManager: "npm",
	},
	{
		npm: true,
		yarn: false,
		pnpm: false,
		npmLockFile: true,
		yarnLockFile: true,
		pnpmLockFile: false,
		expectedPackageManager: "npm",
	},

	// yarn binary only
	{
		npm: false,
		yarn: true,
		pnpm: false,
		npmLockFile: false,
		yarnLockFile: false,
		pnpmLockFile: false,
		expectedPackageManager: "yarn",
	},
	{
		npm: false,
		yarn: true,
		pnpm: false,
		npmLockFile: true,
		yarnLockFile: false,
		pnpmLockFile: false,
		expectedPackageManager: "yarn",
	},
	{
		npm: false,
		yarn: true,
		pnpm: false,
		npmLockFile: false,
		yarnLockFile: true,
		pnpmLockFile: false,
		expectedPackageManager: "yarn",
	},
	{
		npm: false,
		yarn: true,
		pnpm: false,
		npmLockFile: true,
		yarnLockFile: true,
		pnpmLockFile: false,
		expectedPackageManager: "yarn",
	},

	// pnpm binary only
	{
		npm: false,
		yarn: false,
		pnpm: true,
		npmLockFile: false,
		yarnLockFile: false,
		pnpmLockFile: true,
		expectedPackageManager: "pnpm",
	},
	{
		npm: false,
		yarn: false,
		pnpm: true,
		npmLockFile: true,
		yarnLockFile: false,
		pnpmLockFile: false,
		expectedPackageManager: "pnpm",
	},
	{
		npm: false,
		yarn: false,
		pnpm: true,
		npmLockFile: false,
		yarnLockFile: true,
		pnpmLockFile: false,
		expectedPackageManager: "pnpm",
	},
	{
		npm: false,
		yarn: false,
		pnpm: true,
		npmLockFile: true,
		yarnLockFile: true,
		pnpmLockFile: true,
		expectedPackageManager: "pnpm",
	},

	// npm and yarn binaries
	{
		npm: true,
		yarn: true,
		pnpm: false,
		npmLockFile: false,
		yarnLockFile: false,
		pnpmLockFile: false,
		expectedPackageManager: "npm",
	},
	{
		npm: true,
		yarn: true,
		pnpm: false,
		npmLockFile: true,
		yarnLockFile: false,
		pnpmLockFile: false,
		expectedPackageManager: "npm",
	},
	{
		npm: true,
		yarn: true,
		pnpm: false,
		npmLockFile: false,
		yarnLockFile: true,
		pnpmLockFile: false,
		expectedPackageManager: "yarn",
	},
	{
		npm: true,
		yarn: true,
		pnpm: false,
		npmLockFile: true,
		yarnLockFile: true,
		pnpmLockFile: false,
		expectedPackageManager: "npm",
	},
	// npm, yarn and pnpm binaries
	{
		npm: true,
		yarn: true,
		pnpm: true,
		npmLockFile: false,
		yarnLockFile: false,
		pnpmLockFile: false,
		expectedPackageManager: "npm",
	},
	{
		npm: true,
		yarn: true,
		pnpm: true,
		npmLockFile: true,
		yarnLockFile: false,
		pnpmLockFile: false,
		expectedPackageManager: "npm",
	},
	{
		npm: true,
		yarn: true,
		pnpm: true,
		npmLockFile: false,
		yarnLockFile: true,
		pnpmLockFile: false,
		expectedPackageManager: "yarn",
	},
	{
		npm: true,
		yarn: true,
		pnpm: true,
		npmLockFile: false,
		yarnLockFile: false,
		pnpmLockFile: true,
		expectedPackageManager: "pnpm",
	},
	{
		npm: true,
		yarn: true,
		pnpm: true,
		npmLockFile: true,
		yarnLockFile: true,
		pnpmLockFile: true,
		expectedPackageManager: "npm",
	},
];

describe("getPackageManager()", () => {
	runInTempDir();
	mockConsoleMethods();

	describe("no supported package manager", () => {
		mockYarn(false);
		mockNpm(false);
		mockPnpm(false);

		it("should throw an error", async () => {
			await expect(() =>
				getPackageManager(process.cwd())
			).rejects.toThrowErrorMatchingInlineSnapshot(
				`"Unable to find a package manager. Supported managers are: npm, yarn, and pnpm."`
			);
		});
	});

	for (const {
		npm,
		yarn,
		pnpm,
		npmLockFile,
		yarnLockFile,
		pnpmLockFile,
		expectedPackageManager,
	} of testCases) {
		describe(
			getTestCaseDescription(
				npm,
				yarn,
				pnpm,
				npmLockFile,
				yarnLockFile,
				pnpmLockFile
			),
			() => {
				mockYarn(yarn);
				mockNpm(npm);
				mockPnpm(pnpm);
				mockLockFiles(npmLockFile, yarnLockFile, pnpmLockFile);

				it(`should return the ${expectedPackageManager} package manager`, async () => {
					const actualPackageManager = await getPackageManager(process.cwd());
					expect(getPackageManagerName(actualPackageManager)).toEqual(
						expectedPackageManager
					);
				});
			}
		);
	}
});

/**
 * Create a fake yarn binary
 */
function mockYarn(succeed: boolean): void {
	let unMock: () => void;
	beforeEach(async () => {
		unMock = await mockBinary("yarn", `process.exit(${succeed ? 0 : 1})`);
	});
	afterEach(() => unMock());
}

/**
 * Create a fake npm binary
 */
function mockNpm(succeed: boolean): void {
	let unMock: () => void;
	beforeEach(async () => {
		unMock = await mockBinary("npm", `process.exit(${succeed ? 0 : 1})`);
	});
	afterEach(() => unMock());
}

/**
 * Create a fake pnpm binary
 */
function mockPnpm(succeed: boolean): void {
	let unMock: () => void;
	beforeEach(async () => {
		unMock = await mockBinary("pnpm", `process.exit(${succeed ? 0 : 1})`);
	});
	afterEach(() => unMock());
}

/**
 * Create a fake lock files.
 */
function mockLockFiles(
	npmLockFile: boolean,
	yarnLockFile: boolean,
	pnpmLockFile: boolean
) {
	beforeEach(() => {
		if (npmLockFile) {
			writeFileSync("package-lock.json", "");
		}
		if (yarnLockFile) {
			writeFileSync("yarn.lock", "");
		}
		if (pnpmLockFile) {
			writeFileSync("pnpm-lock.yaml", "");
		}
	});
}

function getTestCaseDescription(
	npm: boolean,
	yarn: boolean,
	pnpm: boolean,
	npmLockFile: boolean,
	yarnLockFile: boolean,
	pnpmLockFile: boolean
): string {
	const criteria: string[] = [];
	if (npm) {
		criteria.push("npm");
	}
	if (npmLockFile) {
		criteria.push("package-lock.json");
	}
	if (yarn) {
		criteria.push("yarn");
	}
	if (yarnLockFile) {
		criteria.push("yarn.lock");
	}
	if (pnpm) {
		criteria.push("pnpm");
	}
	if (pnpmLockFile) {
		criteria.push("pnpm-lock.yaml");
	}
	return "using " + criteria.join("; ");
}
