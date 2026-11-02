import { beforeEach, describe, expect, jest, test } from "@jest/globals";
import { EventEmitter } from "events";

jest.mock("../managers/keys", () => ({
  getConfig: jest.fn(async () => ({ data: null, error: "skip" })),
  getKeys: jest.fn(),
}));

import {
  HeliconeRouterSocket,
  isAllowedControlPlaneCredential,
  MAX_CONTROL_PLANE_CONNECTIONS_PER_ORG,
  WebsocketListeners,
} from "../WebsocketListeners";

const ORG = "11111111-1111-1111-1111-111111111111";

function fakeSocket() {
  const ws: any = new EventEmitter();
  ws.send = jest.fn();
  return new HeliconeRouterSocket(ws);
}

describe("WebsocketListeners", () => {
  let listeners: WebsocketListeners;

  beforeEach(() => {
    listeners = new WebsocketListeners();
  });

  test("closed sockets are actually removed", async () => {
    const socket = fakeSocket();
    await listeners.addListener(ORG, {
      socket,
      auth: { organizationId: ORG, authType: "bearer", keyPermissions: "rw" },
    });
    expect(listeners.getListeners(ORG)).toHaveLength(1);

    socket._socket.emit("close");
    expect(listeners.getListeners(ORG)).toHaveLength(0);
  });

  test("connections per organization are capped", async () => {
    for (let i = 0; i < MAX_CONTROL_PLANE_CONNECTIONS_PER_ORG; i++) {
      expect(
        await listeners.addListener(ORG, {
          socket: fakeSocket(),
          auth: { organizationId: ORG, authType: "bearer", keyPermissions: "rw" },
        })
      ).toBe(true);
    }
    expect(
      await listeners.addListener(ORG, {
        socket: fakeSocket(),
        auth: { organizationId: ORG, authType: "bearer", keyPermissions: "rw" },
      })
    ).toBe(false);
    expect(listeners.getListeners(ORG)).toHaveLength(
      MAX_CONTROL_PLANE_CONNECTIONS_PER_ORG
    );
  });

  test("only JWT owners/admins or rw API keys may connect", () => {
    expect(
      isAllowedControlPlaneCredential({ organizationId: ORG, authType: "jwt", role: "admin" })
    ).toBe(true);
    expect(
      isAllowedControlPlaneCredential({ organizationId: ORG, authType: "jwt", role: "member" })
    ).toBe(false);
    expect(
      isAllowedControlPlaneCredential({
        organizationId: ORG,
        authType: "bearer",
        keyPermissions: "rw",
      })
    ).toBe(true);
    expect(
      isAllowedControlPlaneCredential({
        organizationId: ORG,
        authType: "bearer",
        keyPermissions: "w",
      })
    ).toBe(false);
    expect(
      isAllowedControlPlaneCredential({ organizationId: ORG, authType: "bearerProxy" })
    ).toBe(false);
  });
});
