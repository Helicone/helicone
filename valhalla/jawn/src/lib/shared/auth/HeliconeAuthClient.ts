import {
  HeliconeAuth,
  JwtAuth,
  Role,
} from "../../../packages/common/auth/types";
import { KeyPermissions } from "../../../packages/common/auth/types";
import { PromiseGenericResult } from "../../../packages/common/result";

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
}

export type HeliconeUserResult = PromiseGenericResult<HeliconeUser>;

export interface HeliconeAuthClient {
  authenticate: (auth: HeliconeAuth) => AuthResult;
  getOrganization: (authParams: AuthParams) => OrgResult;
  createUser: ({
    email,
    password,
    otp,
  }: {
    email: string;
    password?: string;
    otp?: boolean;
  }) => HeliconeUserResult;

  getUser(auth: JwtAuth): HeliconeUserResult;

  getUserByEmail: (email: string) => HeliconeUserResult;

  getUserById: (userId: string) => HeliconeUserResult;
}
