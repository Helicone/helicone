import {
  replaceLoneSurrogates,
  sanitizeObject,
  safeJSONStringify,
} from "../sanitize";

describe("replaceLoneSurrogates", () => {
  it("should preserve valid emoji surrogate pairs", () => {
    // 😀 is \uD83D\uDE00 (high + low surrogate pair)
    const input = "Hello 😀 World";
    const result = replaceLoneSurrogates(input);
    expect(result).toBe("Hello 😀 World");
  });

  it("should preserve multiple emojis", () => {
    const input = "Hello 😀🎉🚀 World";
    const result = replaceLoneSurrogates(input);
    expect(result).toBe("Hello 😀🎉🚀 World");
  });

  it("should replace lone high surrogate", () => {
    // \uD83D alone without its pair
    const input = "Hello \uD83D World";
    const result = replaceLoneSurrogates(input);
    expect(result).toBe("Hello \uFFFD World");
  });

  it("should replace lone low surrogate", () => {
    // \uDE00 alone without its pair
    const input = "Hello \uDE00 World";
    const result = replaceLoneSurrogates(input);
    expect(result).toBe("Hello \uFFFD World");
  });

  it("should replace lone high surrogate at end of string", () => {
    const input = "Hello World\uD83D";
    const result = replaceLoneSurrogates(input);
    expect(result).toBe("Hello World\uFFFD");
  });

  it("should replace lone low surrogate at start of string", () => {
    const input = "\uDE00Hello World";
    const result = replaceLoneSurrogates(input);
    expect(result).toBe("\uFFFDHello World");
  });

  it("should handle mixed valid and invalid surrogates", () => {
    // Valid emoji followed by lone high surrogate
    const input = "😀\uD83D";
    const result = replaceLoneSurrogates(input);
    expect(result).toBe("😀\uFFFD");
  });

  it("should handle empty string", () => {
    const input = "";
    const result = replaceLoneSurrogates(input);
    expect(result).toBe("");
  });

  it("should handle string with no surrogates", () => {
    const input = "Hello World! 123";
    const result = replaceLoneSurrogates(input);
    expect(result).toBe("Hello World! 123");
  });

  it("should preserve complex emoji sequences", () => {
    // Family emoji with skin tones and ZWJ sequences
    const input = "Test 👨‍👩‍👧‍👦 end";
    const result = replaceLoneSurrogates(input);
    expect(result).toBe("Test 👨‍👩‍👧‍👦 end");
  });

  it("should preserve flag emojis", () => {
    const input = "USA 🇺🇸 flag";
    const result = replaceLoneSurrogates(input);
    expect(result).toBe("USA 🇺🇸 flag");
  });
});

describe("sanitizeObject", () => {
  it("should preserve emojis in strings", () => {
    const input = { message: "Hello 😀 World" };
    const result = sanitizeObject(input);
    expect(result.message).toBe("Hello 😀 World");
  });

  it("should preserve emojis in nested objects", () => {
    const input = {
      outer: {
        inner: "Emoji: 🎉",
      },
    };
    const result = sanitizeObject(input);
    expect(result.outer.inner).toBe("Emoji: 🎉");
  });

  it("should preserve emojis in arrays", () => {
    const input = ["Hello 😀", "World 🌍"];
    const result = sanitizeObject(input);
    expect(result[0]).toBe("Hello 😀");
    expect(result[1]).toBe("World 🌍");
  });

  it("should remove null characters", () => {
    const input = "Hello\u0000World";
    const result = sanitizeObject(input);
    expect(result).toBe("HelloWorld");
  });

  it("should remove lone surrogates", () => {
    const input = "Hello\uD83DWorld";
    const result = sanitizeObject(input);
    expect(result).toBe("HelloWorld");
  });

  it("should handle complex nested structures with emojis", () => {
    const input = {
      messages: [
        { role: "user", content: "Hello 👋" },
        { role: "assistant", content: "Hi there! 😊" },
      ],
      metadata: {
        tags: ["greeting", "emoji 🏷️"],
      },
    };
    const result = sanitizeObject(input);
    expect(result.messages[0].content).toBe("Hello 👋");
    expect(result.messages[1].content).toBe("Hi there! 😊");
    expect(result.metadata.tags[1]).toBe("emoji 🏷️");
  });
});

describe("safeJSONStringify", () => {
  it("should preserve emojis when stringifying", () => {
    const input = { message: "Hello 😀 World" };
    const result = safeJSONStringify(input);
    const parsed = JSON.parse(result);
    expect(parsed.message).toBe("Hello 😀 World");
  });

  it("should handle complex emoji content", () => {
    const input = {
      text: "React with 👍 or 👎",
      status: "🟢 Online",
    };
    const result = safeJSONStringify(input);
    const parsed = JSON.parse(result);
    expect(parsed.text).toBe("React with 👍 or 👎");
    expect(parsed.status).toBe("🟢 Online");
  });
});
