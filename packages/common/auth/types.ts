import { PromiseGenericResult } from "../result";

export type JwtAuth = {
  _type: "jwt";
  token: string;
  orgId?: string;
};
export type BearerAuthProxy = {
  _type: "bearerProxy";
  token: string;
};
export type BearerAuth = {
  _type: "bearer";
  token: string;
};

export type HeliconeAuth = JwtAuth | BearerAuthProxy | BearerAuth;
export type Role = "admin" | "owner" | "member" | undefined;
export type KeyPermissions = "w" | "rw" | undefined;

export interface AuthParams {
  organizationId: string;
  userId?: string;
  heliconeApiKeyId?: number;
  keyPermissions?: KeyPermissions;
  role?: Role;
}
export type AuthResult = PromiseGenericResult<AuthParams>;

export interface OrgParams {
  tier: string;
  id: string;
  percentLog: number;
  has_onboarded: boolean;
}

export type OrgResult = PromiseGenericResult<OrgParams>;

export interface HeliconeUser {
  email: string;
  id: string;
  user_metadata?: {
    name?: string;
    avatar_url?: string;
  };
}

export type HeliconeUserResult = PromiseGenericResult<HeliconeUser>;
