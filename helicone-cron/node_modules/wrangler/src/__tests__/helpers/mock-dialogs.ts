import { confirm, prompt, select } from "../../dialogs";
import { normalizeSlashes } from "./mock-console";

/**
 * The expected values for a confirmation request.
 */
export interface ConfirmExpectation {
	/** The text expected to be seen in the confirmation dialog. */
	text: string;
	/** The mock response send back from the confirmation dialog. */
	result: boolean;
}

/**
 * Mock the implementation of `confirm()` that will respond with configured results
 * for configured confirmation text messages.
 *
 * If there is a call to `confirm()` that does not match any of the expectations
 * then an error is thrown.
 */
export function mockConfirm(...expectations: ConfirmExpectation[]) {
	(confirm as jest.Mock).mockImplementation((text: string) => {
		for (const expectation of expectations) {
			if (normalizeSlashes(text) === normalizeSlashes(expectation.text)) {
				expectations = expectations.filter((e) => e !== expectation);
				return Promise.resolve(expectation.result);
			}
		}
		throw new Error(`Unexpected confirmation message: ${text}`);
	});
	return () => {
		if (expectations.length > 0) {
			throw new Error(
				"The following expected confirmation dialogs were not used:\n" +
					expectations.map((e) => `- "${e.text}"`).join("\n")
			);
		}
	};
}

export function clearConfirmMocks() {
	(confirm as jest.Mock).mockReset();
	// Because confirm was originally a spy, calling mockReset will simply reset
	// it as a function with no return value (!), so we need to accitionally reset
	// the mock implementation to the one that throws (from jest.setup.js).
	(confirm as jest.Mock).mockImplementation((text: string) => {
		throw new Error(
			`Unexpected call to \`confirm("${text}")\`.\nYou should use \`mockConfirm()\` to mock calls to \`confirm()\` with expectations. Search the codebase for \`mockConfirm\` to learn more.`
		);
	});
}

/**
 * The expected values for a prompt request.
 */
export interface PromptExpectation {
	/** The text expected to be seen in the prompt dialog. */
	text: string;
	/** The type of the prompt. */
	type: "text" | "password";
	/** The mock response send back from the prompt dialog. */
	result: string;
}

/**
 * Mock the implementation of `prompt()` that will respond with configured results
 * for configured prompt text messages.
 *
 * If there is a call to `prompt()` that does not match any of the expectations
 * then an error is thrown.
 */
export function mockPrompt(...expectations: PromptExpectation[]) {
	(prompt as jest.Mock).mockImplementation(
		(text: string, type: "text" | "password") => {
			for (const expectation of expectations) {
				if (text === expectation.text && type == expectation.type) {
					expectations = expectations.filter((e) => e !== expectation);
					return Promise.resolve(expectation.result);
				}
			}
			throw new Error(`Unexpected confirmation message: ${text}`);
		}
	);
	return () => {
		if (expectations.length > 0) {
			throw new Error(
				"The following expected prompt dialogs were not used:\n" +
					expectations.map((e) => `- "${e.text}"`).join("\n")
			);
		}
	};
}

export function clearPromptMocks() {
	(prompt as jest.Mock).mockReset();
	// Because prompt was originally a spy, calling mockReset will simply reset
	// it as a function with no return value (!), so we need to accitionally reset
	// the mock implementation to the one that throws (from jest.setup.js).
	(prompt as jest.Mock).mockImplementation((text: string) => {
		throw new Error(
			`Unexpected call to \`prompt(${text}, ...)\`.\nYou should use \`mockPrompt()\` to mock calls to \`prompt()\` with expectations. Search the codebase for \`mockPrompt\` to learn more.`
		);
	});
}

/**
 * The expected values for a select request.
 */
export interface SelectExpectation {
	/** The text expected to be seen in the select dialog. */
	text: string;
	/** The mock response send back from the select dialog. */
	result: string;
}

/**
 * Mock the implementation of `select()` that will respond with configured results
 * for configured select text messages.
 *
 * If there is a call to `select()` that does not match any of the expectations
 * then an error is thrown.
 */
export function mockSelect(...expectations: SelectExpectation[]) {
	(select as jest.Mock).mockImplementation((text: string) => {
		for (const expectation of expectations) {
			if (normalizeSlashes(text) === normalizeSlashes(expectation.text)) {
				expectations = expectations.filter((e) => e !== expectation);
				return Promise.resolve(expectation.result);
			}
		}
		throw new Error(`Unexpected select message: ${text}`);
	});
	return () => {
		if (expectations.length > 0) {
			throw new Error(
				"The following expected select dialogs were not used:\n" +
					expectations.map((e) => `- "${e.text}"`).join("\n")
			);
		}
	};
}

export function clearSelectMocks() {
	(select as jest.Mock).mockReset();
	// Because select was originally a spy, calling mockReset will simply reset
	// it as a function with no return value (!), so we need to additionally reset
	// the mock implementation to the one that throws (from jest.setup.js).
	(select as jest.Mock).mockImplementation((text: string) => {
		throw new Error(
			`Unexpected call to \`select("${text}")\`.\nYou should use \`mockSelect()\` to mock calls to \`select()\` with expectations. Search the codebase for \`mockSelect\` to learn more.`
		);
	});
}
