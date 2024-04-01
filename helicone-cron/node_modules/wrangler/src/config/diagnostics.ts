/**
 * Diagnostic errors and warnings.
 *
 * The structure is a tree, where each node can contain zero or more errors, warnings and child diagnostics objects.
 * You can check whether the overall tree has errors or warnings, and you can render a string representation of the errors or warnings.
 */
export class Diagnostics {
	errors: string[] = [];
	warnings: string[] = [];
	children: Diagnostics[] = [];

	/**
	 * Create a new Diagnostics object.
	 * @param description A general description of this collection of messages.
	 */
	constructor(public description: string) {}

	/**
	 * Merge the given `diagnostics` into this as a child.
	 */
	addChild(diagnostics: Diagnostics): void {
		if (diagnostics.hasErrors() || diagnostics.hasWarnings()) {
			this.children.push(diagnostics);
		}
	}

	/** Does this or any of its children have errors. */
	hasErrors(): boolean {
		if (this.errors.length > 0) {
			return true;
		} else {
			return this.children.some((child) => child.hasErrors());
		}
	}

	/** Render the errors of this and all its children. */
	renderErrors(): string {
		return this.render("errors");
	}

	/** Does this or any of its children have warnings. */
	hasWarnings(): boolean {
		if (this.warnings.length > 0) {
			return true;
		} else {
			return this.children.some((child) => child.hasWarnings());
		}
	}

	/** Render the warnings of this and all its children. */
	renderWarnings(): string {
		return this.render("warnings");
	}

	private render(field: "errors" | "warnings"): string {
		const hasMethod = field === "errors" ? "hasErrors" : "hasWarnings";
		return indentText(
			`${this.description}\n` +
				// Output all the fields (errors or warnings) at this level
				this[field].map((message) => `- ${indentText(message)}`).join("\n") +
				// Output all the child diagnostics at the next level
				this.children
					.map((child) =>
						child[hasMethod]() ? "\n- " + child.render(field) : ""
					)
					.filter((output) => output !== "")
					.join("\n")
		);
	}
}

/** Indent all the but the first line by two spaces. */
function indentText(str: string): string {
	return str
		.split("\n")
		.map((line, index) =>
			(index === 0 ? line : `  ${line}`).replace(/^\s*$/, "")
		)
		.join("\n");
}
