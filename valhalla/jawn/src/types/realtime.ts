/* -------------------------------------------------------------------------- */
/*                               SOCKET MESSAGES                              */
/* -------------------------------------------------------------------------- */
export type SocketMessage = {
  type: string;
  content: any;
  timestamp: string;
  from: "client" | "target";
};
