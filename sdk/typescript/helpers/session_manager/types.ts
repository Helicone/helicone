export interface ISessionManager {
  apiKey: string;
  baseUrl?: string;
}

export interface SessionTokenOptions {
  sessionId: string;
  sessionName: string;
  sessionPath: string;
  userId: string;
  customProperties?: Record<string, any>;
  ttl?: number; // Time to live in seconds, default 1 hour (3600)
}

export interface SessionTokenResult {
  sessionToken: string;
  expiresAt: Date;
}

export interface SessionTokenPayload {
  sessionId: string;
  sessionName: string;
  sessionPath: string;
  userId: string;
  customProperties: Record<string, any>;
  orgId: string;
  iat: number; // Issued at time
  exp: number; // Expiration time
}