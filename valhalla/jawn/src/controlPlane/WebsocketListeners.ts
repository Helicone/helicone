import type {
  MessageTypeRX,
  MessageTypeTX,
} from "@helicone-package/llm-mapper/router-bindings";
import { WebSocket } from "ws";
import { AuthParams } from "../packages/common/auth/types";
import { safeJsonParse } from "../utils/helpers";
import { getConfig, getKeys } from "./managers/keys";

export class HeliconeRouterSocket {
  _socket: WebSocket;
  constructor(socket: WebSocket) {
    this._socket = socket;
  }

  send(message: MessageTypeRX) {
    this._socket.send(JSON.stringify(message));
  }

  onMessage(
    callback: (data: MessageTypeTX | { error: string }) => Promise<void>
  ) {
    this._socket.on("message", (data: ArrayBufferLike, isBinary: boolean) => {
      const dataCopy = Buffer.from(data);
      const message = dataCopy.toString("utf-8");
      callback(
        safeJsonParse(message) ?? {
          error: "Invalid message",
        }
      );
    });
  }
}

type ConnectedRouterState = {
  socket: HeliconeRouterSocket;
  auth: AuthParams;
};

export const MAX_CONTROL_PLANE_CONNECTIONS_PER_ORG = 20;

/**
 * Who may open a control-plane connection: a signed-in owner/admin (JWT) or a
 * Helicone API key with full "rw" permissions. Proxy keys and write-only keys
 * are rejected. The JWT role is re-verified against the database by the
 * caller (see controlPlane.ts).
 */
export function isAllowedControlPlaneCredential(auth: AuthParams): boolean {
  if (auth.authType === "jwt") {
    return auth.role === "owner" || auth.role === "admin";
  }
  if (auth.authType === "bearer") {
    return auth.keyPermissions === "rw";
  }
  return false;
}

export class WebsocketListeners {
  private listeners: Map<string, ConnectedRouterState[]>;

  constructor() {
    this.listeners = new Map();
  }

  canAccept(organizationId: string): boolean {
    return (
      this.getListeners(organizationId).length <
      MAX_CONTROL_PLANE_CONNECTIONS_PER_ORG
    );
  }

  /** Returns false (and registers nothing) when the org is at its cap. */
  async addListener(
    organizationId: string,
    listener: ConnectedRouterState
  ): Promise<boolean> {
    if (!this.canAccept(organizationId)) {
      return false;
    }
    // Register before any await so concurrent connects count against the cap.
    if (!this.listeners.has(organizationId)) {
      this.listeners.set(organizationId, []);
    }
    this.listeners.get(organizationId)?.push(listener);

    listener.socket._socket.on("close", () => {
      this.removeListener(organizationId, listener);
    });
    listener.socket._socket.on("error", (error) => {
      console.error("error", error);
      this.removeListener(organizationId, listener);
    });

    const config = await getConfig({ auth: listener.auth });
    if (!config.error) {
      listener.socket.send({
        _type: "Update",
        Config: {
          data: config.data!,
        },
      });
    }
    return true;
  }

  getListeners(organizationId: string) {
    return this.listeners.get(organizationId) ?? [];
  }

  removeListener(organizationId: string, listener: ConnectedRouterState) {
    const remaining = this.getListeners(organizationId).filter(
      (l) => l !== listener
    );
    if (remaining.length === 0) {
      this.listeners.delete(organizationId);
    } else {
      this.listeners.set(organizationId, remaining);
    }
  }
}
