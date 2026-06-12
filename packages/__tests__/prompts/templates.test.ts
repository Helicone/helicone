import { describe, it, expect } from "@jest/globals";
import { HeliconeTemplateManager } from "@helicone-package/prompts/templates";

describe("HeliconeTemplateManager.substituteVariables", () => {
  it("substitutes falsy-but-valid values (0, false, empty string)", () => {
    expect(
      HeliconeTemplateManager.substituteVariables(
        "You have {{hc:count:number}} new messages",
        { count: 0 },
        {}
      ).result
    ).toBe("You have 0 new messages");

    expect(
      HeliconeTemplateManager.substituteVariables(
        "Enabled: {{hc:flag:boolean}}",
        { flag: false },
        {}
      ).result
    ).toBe("Enabled: false");

    expect(
      HeliconeTemplateManager.substituteVariables(
        "Name=[{{hc:name:string}}]",
        { name: "" },
        {}
      ).result
    ).toBe("Name=[]");
  });

  it("still substitutes truthy values and leaves missing variables untouched", () => {
    expect(
      HeliconeTemplateManager.substituteVariables(
        "You have {{hc:count:number}} new messages",
        { count: 5 },
        {}
      ).result
    ).toBe("You have 5 new messages");

    // Missing input -> placeholder is left as-is
    expect(
      HeliconeTemplateManager.substituteVariables(
        "Hi {{hc:name:string}}",
        {},
        {}
      ).result
    ).toBe("Hi {{hc:name:string}}");
  });
});
