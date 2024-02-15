import { hpromptc, hprompt } from "../core/HeliconePromptFormat";

describe("hprompt", () => {
  it("should handle 1 string variable", () => {
    const firstName = "Bob";
    const raw = hpromptc({ format: "raw" })`Hello ${{ firstName }}`;
    const template = hprompt`Hello ${{ firstName }}`;
    expect(raw).toBe("Hello Bob");
    expect(template).toBe(
      'Hello <helicone-prompt-input key="firstName" >Bob</helicone-prompt-input>'
    );
  });

  it("should handle 1 number variable", () => {
    const count = 10;
    const raw = hpromptc({ format: "raw" })`You're #${{ count }}!`;
    const template = hprompt`You're #${{ count }}!`;
    expect(raw).toBe(`You're #10!`);
    expect(template).toBe(
      `You're #<helicone-prompt-input key="count" >10</helicone-prompt-input>!`
    );
  });

  it("should handle 1 boolean variable", () => {
    const isTrue = true;
    const raw = hpromptc({ format: "raw" })`Is it ${{ isTrue }}?`;
    const template = hprompt`Is it ${{ isTrue }}?`;
    expect(raw).toBe(`Is it true?`);
    expect(template).toBe(
      `Is it <helicone-prompt-input key="isTrue" >true</helicone-prompt-input>?`
    );
  });

  it("should handle a mix of multiple variables", () => {
    const firstName = "Bob";
    const count = 10;
    const isTrue = true;
    const raw = hpromptc({ format: "raw" })`Hello ${{ firstName }}, you're #${{
      count,
    }}!
Is it ${{ isTrue }}?`;
    const template = hprompt`Hello ${{
      firstName,
    }}, you're #${{ count }}!
Is it ${{ isTrue }}?`;
    expect(raw).toBe(`Hello Bob, you're #10!\nIs it true?`);
    expect(template).toBe(
      `Hello <helicone-prompt-input key="firstName" >Bob</helicone-prompt-input>, you're #<helicone-prompt-input key="count" >10</helicone-prompt-input>!
Is it <helicone-prompt-input key="isTrue" >true</helicone-prompt-input>?`
    );
  });

  it("should handle non-object variables", () => {
    const firstName = "Bob";
    const raw = hprompt`Hello ${firstName}`;
    const template = hprompt`Hello ${firstName}`;
    expect(raw).toBe("Hello Bob");
    expect(template).toBe("Hello Bob");
  });
});
