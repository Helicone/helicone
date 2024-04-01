import {
	formatMessage,
	searchLocation,
	indexLocation,
	parseJSON,
	parseTOML,
} from "../parse";
import type { Message } from "../parse";

describe("formatMessage", () => {
	const format = (input: Message) => {
		// No color and skip emojis at the start.
		return formatMessage(input, false).substring(2);
	};

	it("should format message without location", () => {
		expect(
			format({
				text: "Invalid argument",
				kind: "warning",
			})
		).toMatchInlineSnapshot(`
      "[WARNING] Invalid argument

      "
    `);
	});

	it("should format message with location", () => {
		expect(
			format({
				text: "Missing property: main",
				location: {
					line: 1,
					column: 0,
					lineText: "{}",
					file: "package.json",
					fileText: "{}",
				},
			})
		).toMatchInlineSnapshot(`
      "[ERROR] Missing property: main

          package.json:1:0:
            1 │ {}
              ╵ ^

      "
    `);
	});

	it("should format message with location and notes", () => {
		expect(
			format({
				text: "Invalid property: type",
				location: {
					line: 3,
					column: 8,
					length: 7,
					lineText: "type = 'modular'",
					suggestion: "Did you mean 'module'?",
					file: "package.toml",
					fileText: "[package]\ntype = 'modular'\n",
				},
				notes: [
					{
						text: "There are two acceptable types: 'module' and 'commonjs'",
					},
				],
			})
		).toMatchInlineSnapshot(`
      "[ERROR] Invalid property: type

          package.toml:3:8:
            3 │ type = 'modular'
              │         ~~~~~~~
              ╵         Did you mean 'module'?

        There are two acceptable types: 'module' and 'commonjs'

      "
    `);
	});
});

describe("parseTOML", () => {
	it("should parse toml that is empty", () => {
		expect(parseTOML("")).toStrictEqual({});
	});

	it("should parse toml with basic values", () => {
		expect(
			parseTOML(`
        name = "basic"
        version = 1
    `)
		).toStrictEqual({
			name: "basic",
			version: 1,
		});
	});

	it("should parse toml with complex values", () => {
		expect(
			parseTOML(`
        name = 'complex'
        version = 1
        [owner]
        name = ["tim"]
        alive = true
        [owner.dog]
        exists = true
      `)
		).toStrictEqual({
			name: "complex",
			owner: {
				alive: true,
				dog: {
					exists: true,
				},
				name: ["tim"],
			},
			version: 1,
		});
	});

	it("should fail to parse toml with invalid string", () => {
		try {
			parseTOML(`name = 'fail"`);
			fail("parseTOML did not throw");
		} catch (err) {
			expect({ ...(err as Error) }).toStrictEqual({
				name: "ParseError",
				text: "Unterminated string",
				kind: "error",
				location: {
					line: 1,
					column: 14,
					fileText: "name = 'fail\"",
					file: undefined,
					lineText: "name = 'fail\"",
				},
				notes: [],
			});
		}
	});

	it("should fail to parse toml with invalid header", () => {
		try {
			parseTOML(`\n[name`, "config.toml");
			fail("parseTOML did not throw");
		} catch (err) {
			expect({ ...(err as Error) }).toStrictEqual({
				name: "ParseError",
				text: "Key ended without value",
				kind: "error",
				location: {
					line: 2,
					column: 5,
					lineText: "[name",
					file: "config.toml",
					fileText: "\n[name",
				},
				notes: [],
			});
		}
	});

	it("should cope with Windows line-endings", () => {
		expect(
			parseTOML(
				"# A comment with a Windows line-ending\r\n# Another comment with a Windows line-ending\r\n"
			)
		).toEqual({});
	});
});

describe("parseJSON", () => {
	it("should parse json that is empty", () => {
		expect(parseJSON("{}")).toStrictEqual({});
	});

	it("should parse json with basic values", () => {
		expect(
			parseJSON(`
      {
        "name" : "basic",
        "version": 1
      }`)
		).toStrictEqual({
			name: "basic",
			version: 1,
		});
	});

	it("should parse json with complex values", () => {
		expect(
			parseJSON(
				`{
          "name":"complex",
          "spec":{
            "uptime":[1,2.5,3],
            "ok":true
          }
        }`
			)
		).toStrictEqual({
			name: "complex",
			spec: {
				uptime: [1, 2.5, 3],
				ok: true,
			},
		});
	});

	it("should fail to parse json with invalid string", () => {
		try {
			parseJSON(`\n{\n"version" "1\n}\n`);
			fail("parseJSON did not throw");
		} catch (err) {
			expect({ ...(err as Error) }).toStrictEqual({
				name: "ParseError",
				text: "Unexpected string",
				kind: "error",
				location: {
					line: 3,
					column: 9,
					lineText: '"version" "1',
					file: undefined,
					fileText: `\n{\n"version" "1\n}\n`,
				},
				notes: [],
			});
		}
	});

	it("should fail to parse json with invalid number", () => {
		const file = "config.json",
			fileText = `{\n\t"a":{\n\t\t"b":{\n\t\t\t"c":[012345]\n}\n}\n}`;
		try {
			parseJSON(fileText, file);
			fail("parseJSON did not throw");
		} catch (err) {
			expect({ ...(err as Error) }).toStrictEqual({
				name: "ParseError",
				text: "Unexpected number",
				kind: "error",
				location: {
					file,
					fileText,
					line: 4,
					column: 8,
					lineText: `\t\t\t"c":[012345]`,
				},
				notes: [],
			});
		}
	});
});

describe("indexLocation", () => {
	it("should calculate location from one-line input", () => {
		const fileText = "";
		expect(indexLocation({ fileText }, 1)).toStrictEqual({
			fileText,
			line: 1,
			column: 0,
			lineText: "",
		});
	});

	it("should calculate location from multi-line input", () => {
		const file = "package.json",
			fileText = `\n{\n\t"hello":"world"\n}\n`;
		expect(indexLocation({ file, fileText }, 11)).toStrictEqual({
			file,
			fileText,
			line: 3,
			column: 7,
			lineText: `\t"hello":"world"`,
		});
	});

	it("should calculate location when index is out of bounds", () => {
		const fileText = `\n\n\n\n`;
		expect(indexLocation({ fileText }, 10)).toStrictEqual({
			fileText,
			line: 5,
			column: 0,
			lineText: undefined,
		});
	});
});

describe("searchLocation", () => {
	it("should calculate location from one-line match", () => {
		const file = "config.toml",
			fileText = `name = 'coolthing'`;
		expect(searchLocation({ file, fileText }, "coolthing")).toStrictEqual({
			file,
			fileText,
			line: 1,
			column: 8,
			length: 9,
			lineText: `name = 'coolthing'`,
		});
	});

	it("should calculate location from multi-line match", () => {
		const fileText = `\n{"versions":[\n\t"1.2.3",\n\t"1.2.4",\n\t"1.2.5"\n]}\n`;
		expect(searchLocation({ fileText }, "1.2.4")).toStrictEqual({
			fileText,
			line: 4,
			column: 2,
			length: 5,
			lineText: `\t"1.2.4",`,
		});
	});

	it("should calculate location from no match", () => {
		const fileText = `\n{}\n`;
		expect(searchLocation({ fileText }, "apple")).toStrictEqual({
			fileText,
			line: 3,
			column: 0,
			length: undefined,
			lineText: undefined,
		});
	});
});
