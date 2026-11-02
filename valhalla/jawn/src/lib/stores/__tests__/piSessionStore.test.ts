import { beforeEach, describe, expect, jest, test } from "@jest/globals";

jest.mock("../../shared/db/dbExecute", () => ({
  dbExecute: jest.fn(),
}));
jest.mock("../../clients/redisClient", () => ({
  redisClient: null,
}));

import { dbExecute } from "../../shared/db/dbExecute";
import {
  createPendingPiSession,
  hashPiSessionId,
  isValidPiSessionId,
  linkPiSession,
  redeemPiSession,
} from "../piSessionStore";

const mockDbExecute = dbExecute as jest.MockedFunction<typeof dbExecute>;
const ORG = "11111111-1111-1111-1111-111111111111";
const USER = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

let rows: Array<{ session_id: string; organization_id: string }>;

function installDb() {
  rows = [];
  mockDbExecute.mockImplementation((async (sql: string, params: any[]) => {
    const q = sql.replace(/\s+/g, " ").trim();
    if (q.startsWith("INSERT INTO pi_session")) {
      rows.push({ session_id: params[0], organization_id: params[1] });
      return { data: [], error: null };
    }
    if (q.startsWith("DELETE FROM pi_session WHERE session_id = $1")) {
      const idx = rows.findIndex((r) => r.session_id === params[0]);
      if (idx === -1) return { data: [], error: null };
      const [row] = rows.splice(idx, 1);
      return { data: [{ organization_id: row.organization_id }], error: null };
    }
    throw new Error(`Unexpected query: ${q}`);
  }) as any);
}

describe("PI device-link sessions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    installDb();
  });

  test("session ids are server-generated, 256-bit and unique", async () => {
    const a = await createPendingPiSession();
    const b = await createPendingPiSession();
    expect(isValidPiSessionId(a)).toBe(true);
    expect(a).not.toBe(b);
  });

  test("client-chosen ids cannot be linked", async () => {
    const clientUuid = "123e4567-e89b-12d3-a456-426614174000";
    expect(
      (await linkPiSession({ sessionId: clientUuid, organizationId: ORG, userId: USER }))
        .error
    ).toBeTruthy();
    // Well-formed but never issued by the server.
    const forged = "A".repeat(43);
    expect(
      (await linkPiSession({ sessionId: forged, organizationId: ORG, userId: USER }))
        .error
    ).toBeTruthy();
    expect(rows).toHaveLength(0);
  });

  test("a session links once and redeems once, storing only a hash", async () => {
    const id = await createPendingPiSession();
    expect(
      (await linkPiSession({ sessionId: id, organizationId: ORG, userId: USER }))
        .error
    ).toBeNull();
    expect(rows[0].session_id).toBe(hashPiSessionId(id));
    expect(rows[0].session_id).not.toBe(id);

    // Cannot be re-linked to another organization.
    expect(
      (
        await linkPiSession({
          sessionId: id,
          organizationId: "22222222-2222-2222-2222-222222222222",
          userId: USER,
        })
      ).error
    ).toBeTruthy();

    const first = await redeemPiSession(id);
    expect(first.error).toBeNull();
    expect(first.data).toEqual({ organizationId: ORG, userId: USER });

    const second = await redeemPiSession(id);
    expect(second.error).toBeTruthy();
  });

  test("unlinked or malformed sessions cannot be redeemed", async () => {
    const id = await createPendingPiSession();
    expect((await redeemPiSession(id)).error).toBeTruthy();
    expect((await redeemPiSession("not-a-session")).error).toBeTruthy();
  });
});
