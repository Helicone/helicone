import { NotificationResponseMessage } from "pg-protocol/dist/messages";
import { HELICONE_DB } from "../lib/shared/db/pgpClient";
import { websocketListeners } from "./controlPlane";
import { dbExecute } from "../lib/shared/db/dbExecute";
import { getKeys } from "./managers/keys";

interface BroadcastPayload {
  event: "api_key_updated";
  organization_id: string;
  api_key_id?: number;
  op: "INSERT" | "UPDATE" | "DELETE";
}

// LISTEN to connected_gateways
export const startDBListener = async () => {
  const client = await HELICONE_DB.connect();
  await client.client
    .on("notification", async (message: NotificationResponseMessage) => {
      const payload: BroadcastPayload = JSON.parse(message.payload);

      if (payload.event === "api_key_updated") {
        const listeners = websocketListeners.getListeners(
          payload.organization_id,
        );

        const keys = await getKeys(payload.organization_id);
        if (keys.error || keys.data?.length === 0) {
          return;
        }

        listeners.forEach((listener) => {
          listener.socket.send({
            _type: "Update",
            Keys: {
              data: keys.data!.map((key) => ({
                ownerId: key.user_id,
                keyHash: key.api_key_hash,
                organizationId: payload.organization_id,
              })),
            },
          });
        });
      }
    })
    .query("LISTEN connected_gateways");
};
