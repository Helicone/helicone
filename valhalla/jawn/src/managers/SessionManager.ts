import { SessionQueryParams } from "../controllers/public/sessionController";

export class SessionManager {
  async getSessions(
    requestBody: SessionQueryParams
  ): Promise<Result<SessionsResult[], string>> {}
}
