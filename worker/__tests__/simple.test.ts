// test/index.spec.mjs
// import worker, from "../src/index.mjs";

import { parseJSXObject } from "../src/api/lib/promptHelpers";

describe("parseJSXObject", () => {
  test("should extract text and tags from complex nested objects", () => {
    const input = {
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            'This is a rap battle between <helicone-prompt-input key="person1">asdfsad</helicone-prompt-input> and <helicone-prompt-input key="person2">dfdsa</helicone-prompt-input>.\n\nHere are the rules that apply to each rapper with the following multipliers:\n- Lines in a verse must rhyme\n- Creativity\n- Flaunting their success\n- Making fun of the opponent\n- Aggressiveness towards the opponent\n\nVerse format:\n```\n<helicone-prompt-input key="person1">asdfsad</helicone-prompt-input> - {gender}\n{line},\n{line}.\n{line},\n{line}.\n---\n<helicone-prompt-input key="person1">asdfsad</helicone-prompt-input> - {gender}\n{line},\n{line}.\n{line},\n{line}.\n```\n\nMultipliers:\n{\n  <helicone-prompt-input key="person1">asdfsad</helicone-prompt-input>: {\n    "rhyme": 1,\n    "creativity": 4,\n    "flaunting": 5,\n    "make_fun": 5,\n    "aggressiveness": 10\n},\n<helicone-prompt-input key="person2">dfdsa</helicone-prompt-input>: {\n    "rhyme": 1,\n    "creativity": 4,\n    "flaunting": 5,\n    "make_fun": 5,\n    "aggressiveness": 10\n}\n}\n\n\nPrevious verses:\n```<helicone-prompt-input key="prevVerses">None</helicone-prompt-input>\n```\n\nNext verse:\n```',
        },
      ],
    };

    const expectedOutput = {
      objectWithoutJSXTags: {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content:
              'This is a rap battle between asdfsad and dfdsa.\n\nHere are the rules that apply to each rapper with the following multipliers:\n- Lines in a verse must rhyme\n- Creativity\n- Flaunting their success\n- Making fun of the opponent\n- Aggressiveness towards the opponent\n\nVerse format:\n```\nasdfsad - {gender}\n{line},\n{line}.\n{line},\n{line}.\n---\nasdfsad - {gender}\n{line},\n{line}.\n{line},\n{line}.\n```\n\nMultipliers:\n{\n  asdfsad: {\n    "rhyme": 1,\n    "creativity": 4,\n    "flaunting": 5,\n    "make_fun": 5,\n    "aggressiveness": 10\n},\ndfdsa: {\n    "rhyme": 1,\n    "creativity": 4,\n    "flaunting": 5,\n    "make_fun": 5,\n    "aggressiveness": 10\n}\n}\n\n\nPrevious verses:\n```None\n```\n\nNext verse:\n```',
          },
        ],
      },
      templateWithInputs: {
        template: {
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content:
                'This is a rap battle between <helicone-prompt-input key="person1" /> and <helicone-prompt-input key="person2" />.\n\nHere are the rules that apply to each rapper with the following multipliers:\n- Lines in a verse must rhyme\n- Creativity\n- Flaunting their success\n- Making fun of the opponent\n- Aggressiveness towards the opponent\n\nVerse format:\n```\n<helicone-prompt-input key="person1" /> - {gender}\n{line},\n{line}.\n{line},\n{line}.\n---\n<helicone-prompt-input key="person1" /> - {gender}\n{line},\n{line}.\n{line},\n{line}.\n```\n\nMultipliers:\n{\n  <helicone-prompt-input key="person1" />: {\n    "rhyme": 1,\n    "creativity": 4,\n    "flaunting": 5,\n    "make_fun": 5,\n    "aggressiveness": 10\n},\n<helicone-prompt-input key="person2" />: {\n    "rhyme": 1,\n    "creativity": 4,\n    "flaunting": 5,\n    "make_fun": 5,\n    "aggressiveness": 10\n}\n}\n\n\nPrevious verses:\n```<helicone-prompt-input key="prevVerses" />\n```\n\nNext verse:\n```',
            },
          ],
        },
        inputs: {
          person1: "asdfsad",
          person2: "dfdsa",
          prevVerses: "None",
        },
      },
    };

    const result = parseJSXObject(input);

    expect(result).toEqual(expectedOutput);
  });

  test("should work with new lines as inputs", () => {
    const input = {
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `This is a test <helicone-prompt-input key="key1">test\nhello</helicone-prompt-input> world`,
        },
      ],
    };

    const expectedOutput = {
      objectWithoutJSXTags: {
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "This is a test test\nhello world",
          },
        ],
      },
      templateWithInputs: {
        template: {
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content:
                'This is a test <helicone-prompt-input key="key1" /> world',
            },
          ],
        },
        inputs: {
          key1: "test\nhello",
        },
      },
    };

    const result = parseJSXObject(input);

    expect(result).toEqual(expectedOutput);
  });
});
export {};
