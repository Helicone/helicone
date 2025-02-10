/* -------------------------------------------------------------------------- */
/*                               SOCKET MESSAGES                              */
/* -------------------------------------------------------------------------- */
export type SocketMessage = {
  type: string; // "message" or "error"
  timestamp: string; // ISO String
  from: "client" | "target";
  content: any; // RealtimeMessage
};
