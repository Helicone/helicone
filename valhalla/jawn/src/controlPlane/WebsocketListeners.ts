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
    callback: (data: MessageTypeTX | { error: string }) => Promise<void>,
  ) {
    this._socket.on("message", (data: ArrayBufferLike, isBinary: boolean) => {
      const dataCopy = Buffer.from(data);
      const message = dataCopy.toString("utf-8");
      callback(
        safeJsonParse(message) ?? {
          error: "Invalid message",
        },
      );
    });
  }
}

type ConnectedRouterState = {
  socket: HeliconeRouterSocket;
  auth: AuthParams;
};

export class WebsocketListeners {
  private listeners: Map<string, ConnectedRouterState[]>;

  constructor() {
    this.listeners = new Map();
  }

  async addListener(organizationId: string, listener: ConnectedRouterState) {
    const config = await getConfig({ auth: listener.auth });
    if (!config.error) {
      listener.socket.send({
        _type: "Update",
        Config: {
          data: config.data!,
        },
      });
    }

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
  }

  getListeners(organizationId: string) {
    return this.listeners.get(organizationId) ?? [];
  }

  removeListener(organizationId: string, listener: ConnectedRouterState) {
    this.listeners.get(organizationId)?.filter((l) => l !== listener);
  }
}
