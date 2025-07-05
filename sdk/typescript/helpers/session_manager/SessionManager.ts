import { ISessionManager, SessionTokenOptions, SessionTokenResult } from "./types";

export class SessionManager {
  private apiKey: string;
  private baseUrl: string;

  constructor(opts: ISessionManager) {
    this.apiKey = opts.apiKey;
    this.baseUrl = opts.baseUrl || "https://api.helicone.ai";
  }

  /**
   * Generates a new session token for temporary authentication
   * @param options - The session token options
   * @returns A promise that resolves to the session token result
   */
  async newSessionToken(options: SessionTokenOptions): Promise<SessionTokenResult> {
    const {
      sessionId,
      sessionName,
      sessionPath,
      userId,
      customProperties = {},
      ttl = 3600, // Default 1 hour
    } = options;

    try {
      const response = await fetch(`${this.baseUrl}/v1/session/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          sessionId,
          sessionName,
          sessionPath,
          userId,
          customProperties,
          ttl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`HTTP ${response.status}: ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.sessionToken) {
        throw new Error("No session token received from server");
      }

      return {
        sessionToken: data.sessionToken,
        expiresAt: new Date(Date.now() + ttl * 1000),
      };
    } catch (error) {
      throw new Error(`Failed to generate session token: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Validates a session token
   * @param sessionToken - The session token to validate
   * @returns A promise that resolves to true if valid, false otherwise
   */
  async validateSessionToken(sessionToken: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/session/token/validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({ sessionToken }),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.valid === true;
    } catch (error) {
      console.error("Error validating session token:", error);
      return false;
    }
  }
}