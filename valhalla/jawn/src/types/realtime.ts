/* -------------------------------------------------------------------------- */
/*                               SOCKET MESSAGES                              */
/* -------------------------------------------------------------------------- */
export type SocketMessage = {
  type: string;
  from: "client" | "target";
  timestamp: string;
  content: any; // RealTimeMessage
};
