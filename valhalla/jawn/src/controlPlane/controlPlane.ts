import internal from "stream";
import { WebSocketServer } from "ws";
import { RequestWrapper } from "../lib/requestWrapper/requestWrapper";
import { authFromRequest } from "../middleware/auth";
import { toExpressRequest } from "../utils/expressHelpers";
import {
  HeliconeRouterSocket,
  isAllowedControlPlaneCredential,
  WebsocketListeners,
} from "./WebsocketListeners";
import { AuthParams } from "../packages/common/auth/types";
import { Result } from "../packages/common/result";
import { authorizeOrgActor, ORG_ADMIN_ROLES } from "../utils/orgAuthz";
import { MessageTypeRX } from "@helicone-package/llm-mapper/router-bindings";
// Create a WebSocket server to handle the upgrade
const wss = new WebSocketServer({ noServer: true });

export const websocketListeners = new WebsocketListeners();

export async function webSocketControlPlaneServer(
  requestWrapper: RequestWrapper,
  socket: internal.Duplex,
  head: Buffer
) {
  const req = requestWrapper.getRequest();
  const auth = await authFromRequest(toExpressRequest(req));

  const rejection = await getControlPlaneRejection(auth);
  if (rejection) {
    wss.handleUpgrade(req, socket, head, async (clientWs) => {
      clientWs.send(
        JSON.stringify({
          _type: "Error",
          message: rejection,
        } as MessageTypeRX)
      );
    });

    await new Promise((resolve) => setTimeout(resolve, 2_000));
    socket.destroy();
    return;
  }

  const authParams = auth.data!;
  wss.handleUpgrade(req, socket, head, async (clientWs) => {
    const accepted = await websocketListeners.addListener(
      authParams.organizationId,
      {
        socket: new HeliconeRouterSocket(clientWs),
        auth: authParams,
      }
    );
    if (!accepted) {
      clientWs.send(
        JSON.stringify({
          _type: "Error",
          message: "Too many control-plane connections for this organization",
        } as MessageTypeRX)
      );
      clientWs.close();
    }
  });
}

async function getControlPlaneRejection(
  auth: Result<AuthParams, string>
): Promise<string | null> {
  if (auth.error || !auth.data) {
    return auth.error ?? "Unauthorized";
  }
  if (!isAllowedControlPlaneCredential(auth.data)) {
    return "Forbidden: requires an organization owner/admin session or an rw API key";
  }
  if (auth.data.authType === "jwt") {
    // Re-check the role in the database rather than trusting the cached one.
    const actor = await authorizeOrgActor(auth.data, ORG_ADMIN_ROLES);
    if (actor.error !== null) {
      return actor.error.message;
    }
  }
  if (!websocketListeners.canAccept(auth.data.organizationId)) {
    return "Too many control-plane connections for this organization";
  }
  return null;
}
