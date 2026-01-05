import { sortAttemptsByPriority } from "../../cost/models/providers/priorities";

describe("sortAttemptsByPriority", () => {
  it("should prioritize BYOK over PTB", () => {
    const attempts = [
      {
        authType: "ptb" as const,
        priority: 2,
        endpoint: { pricing: [{ input: 1, output: 1 }] },
      },
      {
        authType: "byok" as const,
        priority: 1,
        endpoint: { pricing: [{ input: 100, output: 100 }] },
      },
    ];

    const sorted = sortAttemptsByPriority(attempts);

    expect(sorted[0].authType).toBe("byok");
    expect(sorted[1].authType).toBe("ptb");
  });

  it("should sort PTB attempts by cost (lowest first)", () => {
    const attempts = [
      {
        authType: "ptb" as const,
        priority: 3,
        endpoint: { pricing: [{ input: 5, output: 15 }] }, // cost: 20
        name: "expensive",
      },
      {
        authType: "ptb" as const,
        priority: 4,
        endpoint: { pricing: [{ input: 1, output: 1 }] }, // cost: 2
        name: "cheap",
      },
      {
        authType: "ptb" as const,
        priority: 3,
        endpoint: { pricing: [{ input: 2, output: 3 }] }, // cost: 5
        name: "medium",
      },
    ];

    const sorted = sortAttemptsByPriority(attempts);

    expect(sorted[0].name).toBe("cheap"); // cost: 2
    expect(sorted[1].name).toBe("medium"); // cost: 5
    expect(sorted[2].name).toBe("expensive"); // cost: 20
  });

  it("should sort by priority within same cost for PTB", () => {
    const attempts = [
      {
        authType: "ptb" as const,
        priority: 4,
        endpoint: { pricing: [{ input: 1, output: 1 }] }, // cost: 2
        name: "other-provider",
      },
      {
        authType: "ptb" as const,
        priority: 2,
        endpoint: { pricing: [{ input: 1, output: 1 }] }, // cost: 2
        name: "helicone",
      },
      {
        authType: "ptb" as const,
        priority: 3,
        endpoint: { pricing: [{ input: 1, output: 1 }] }, // cost: 2
        name: "openai",
      },
    ];

    const sorted = sortAttemptsByPriority(attempts);

    expect(sorted[0].name).toBe("helicone"); // priority: 2
    expect(sorted[1].name).toBe("openai"); // priority: 3
    expect(sorted[2].name).toBe("other-provider"); // priority: 4
  });

  it("should handle full sorting: BYOK > PTB by cost > PTB by priority", () => {
    const attempts = [
      {
        authType: "ptb" as const,
        priority: 3,
        endpoint: { pricing: [{ input: 5, output: 15 }] }, // cost: 20
        name: "ptb-openai-expensive",
      },
      {
        authType: "ptb" as const,
        priority: 4,
        endpoint: { pricing: [{ input: 1, output: 1 }] }, // cost: 2
        name: "ptb-other-cheap",
      },
      {
        authType: "ptb" as const,
        priority: 3,
        endpoint: { pricing: [{ input: 2, output: 3 }] }, // cost: 5
        name: "ptb-openai-medium",
      },
      {
        authType: "byok" as const,
        priority: 1,
        endpoint: { pricing: [{ input: 100, output: 100 }] }, // cost: 200
        name: "byok-expensive",
      },
      {
        authType: "ptb" as const,
        priority: 2,
        endpoint: { pricing: [{ input: 1, output: 1 }] }, // cost: 2
        name: "ptb-helicone-cheap",
      },
    ];

    const sorted = sortAttemptsByPriority(attempts);

    // BYOK always first, regardless of cost
    expect(sorted[0].name).toBe("byok-expensive");

    // PTB sorted by cost first
    expect(sorted[1].name).toBe("ptb-helicone-cheap"); // cost: 2, priority: 2
    expect(sorted[2].name).toBe("ptb-other-cheap"); // cost: 2, priority: 4
    expect(sorted[3].name).toBe("ptb-openai-medium"); // cost: 5
    expect(sorted[4].name).toBe("ptb-openai-expensive"); // cost: 20
  });

  it("should sort BYOK attempts by priority", () => {
    const attempts = [
      {
        authType: "byok" as const,
        priority: 3,
        endpoint: { pricing: [{ input: 1, output: 1 }] },
        name: "byok-openai",
      },
      {
        authType: "byok" as const,
        priority: 1,
        endpoint: { pricing: [{ input: 1, output: 1 }] },
        name: "byok-high-priority",
      },
      {
        authType: "byok" as const,
        priority: 4,
        endpoint: { pricing: [{ input: 1, output: 1 }] },
        name: "byok-other",
      },
    ];

    const sorted = sortAttemptsByPriority(attempts);

    expect(sorted[0].name).toBe("byok-high-priority"); // priority: 1
    expect(sorted[1].name).toBe("byok-openai"); // priority: 3
    expect(sorted[2].name).toBe("byok-other"); // priority: 4
  });
});
