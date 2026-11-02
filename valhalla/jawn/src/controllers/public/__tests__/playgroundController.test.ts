import { beforeEach, describe, expect, jest, test } from "@jest/globals";

jest.mock("../../../lib/shared/db/dbExecute", () => ({
  dbExecute: jest.fn(),
}));
jest.mock("../../../lib/experiment/tempKeys/tempAPIKey", () => ({
  generateTempHeliconeAPIKey: jest.fn(),
}));
jest.mock("../../../lib/clients/redisClient", () => ({ redisClient: null }));

import { dbExecute } from "../../../lib/shared/db/dbExecute";
import { generateTempHeliconeAPIKey } from "../../../lib/experiment/tempKeys/tempAPIKey";
import {
  getJwtMemberRole,
  PlaygroundController,
} from "../playgroundController";

const ORG = "11111111-1111-1111-1111-111111111111";
const USER = "22222222-2222-2222-2222-222222222222";

const mockDbExecute = dbExecute as jest.MockedFunction<typeof dbExecute>;
const mockTempKey = generateTempHeliconeAPIKey as jest.MockedFunction<
  typeof generateTempHeliconeAPIKey
>;

function req(authParams: Record<string, any>) {
  return { authParams: { organizationId: ORG, ...authParams } } as any;
}

beforeEach(() => {
  mockDbExecute.mockReset();
  mockTempKey.mockReset();
});

describe("getJwtMemberRole", () => {
  test("API keys never resolve to a role, even with a stored user id", async () => {
    const role = await getJwtMemberRole(
      req({ authType: "bearer", userId: USER }).authParams
    );
    expect(role).toBeNull();
    expect(mockDbExecute).not.toHaveBeenCalled();
  });

  test("JWT member resolves to its org role", async () => {
    mockDbExecute.mockResolvedValue({
      data: [{ org_role: "admin" }],
      error: null,
    });
    expect(
      await getJwtMemberRole(req({ authType: "jwt", userId: USER }).authParams)
    ).toBe("admin");
  });

  test("JWT user that is not a member resolves to null", async () => {
    mockDbExecute.mockResolvedValue({ data: [], error: null });
    expect(
      await getJwtMemberRole(req({ authType: "jwt", userId: USER }).authParams)
    ).toBeNull();
  });
});

describe("PlaygroundController", () => {
  test("generate rejects API-key callers before minting a temp key", async () => {
    const controller = new PlaygroundController();
    const result = await controller.generate(
      { model: "gpt-4o", messages: [] } as any,
      req({ authType: "bearer", userId: USER })
    );
    expect(result.error).toMatch(/signed-in organization member/);
    expect(controller.getStatus()).toBe(403);
    expect(mockTempKey).not.toHaveBeenCalled();
  });

  test("requests-through-helicone toggle requires owner/admin", async () => {
    mockDbExecute.mockResolvedValue({
      data: [{ org_role: "member" }],
      error: null,
    });
    const controller = new PlaygroundController();
    const result = await controller.requestsThroughHelicone(
      { requestsThroughHelicone: true },
      req({ authType: "jwt", userId: USER })
    );
    expect(result.error).toMatch(/owners and admins/);
    expect(controller.getStatus()).toBe(403);
    // only the role lookup ran, no UPDATE organization
    expect(mockDbExecute).toHaveBeenCalledTimes(1);
  });

  test("requests-through-helicone toggle rejects API keys", async () => {
    const controller = new PlaygroundController();
    const result = await controller.requestsThroughHelicone(
      { requestsThroughHelicone: true },
      req({ authType: "bearer", userId: USER })
    );
    expect(result.error).toMatch(/owners and admins/);
    expect(mockDbExecute).not.toHaveBeenCalled();
  });
});
