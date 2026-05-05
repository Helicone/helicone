import { describe, it, beforeEach, vi } from "vitest";
import "../setup";
import { runGatewayTest } from "./test-framework";
import { createOpenAIMockResponse } from "../test-utils";

const hpcaiAuthExpectations = {
  headers: {
    Authorization: /^Bearer /,
  },
};

describe("HPC-AI Registry Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("BYOK Tests - MiniMax M2.5", () => {
    it("should handle hpcai provider for minimax-m2.5", () =>
      runGatewayTest({
        model: "minimax-m2.5/hpcai",
        expected: {
          providers: [
            {
              url: "https://api.hpc-ai.com/inference/v1/chat/completions",
              response: "success",
              model: "minimax/minimax-m2.5",
              data: createOpenAIMockResponse("minimax/minimax-m2.5"),
              expects: hpcaiAuthExpectations,
            },
          ],
          finalStatus: 200,
        },
      }));
  });

  describe("BYOK Tests - Kimi K2.5", () => {
    it("should handle hpcai provider for kimi-k2.5", () =>
      runGatewayTest({
        model: "kimi-k2.5/hpcai",
        expected: {
          providers: [
            {
              url: "https://api.hpc-ai.com/inference/v1/chat/completions",
              response: "success",
              model: "moonshotai/kimi-k2.5",
              data: createOpenAIMockResponse("moonshotai/kimi-k2.5"),
              expects: hpcaiAuthExpectations,
            },
          ],
          finalStatus: 200,
        },
      }));
  });
});
