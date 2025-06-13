import internal from "stream";
import { WebSocketServer } from "ws";
import { RequestWrapper } from "../lib/requestWrapper/requestWrapper";
import { authFromRequest } from "../middleware/auth";
import { toExpressRequest } from "../utils/expressHelpers";
import { HeliconeRouterSocket, WebsocketListeners } from "./WebsocketListeners";
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
  if (auth.error || !auth.data) {
    socket.write(
      JSON.stringify({
        type: "error",
        error: auth.error,
      })
    );
    socket.destroy();
  } else {
    wss.handleUpgrade(req, socket, head, async (clientWs) => {
      websocketListeners.addListener(auth.data.organizationId, {
        socket: new HeliconeRouterSocket(clientWs),
        auth: auth.data,
      });
    });
  }
}
