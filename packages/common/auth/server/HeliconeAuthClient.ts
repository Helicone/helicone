import {
  AuthParams,
  AuthResult,
  HeliconeAuth,
  HeliconeUserResult,
  JwtAuth,
  OrgResult,
} from "../types";

export type GenericHeaders = Record<string, string | string[] | undefined>;
export interface HeliconeAuthClient {
  authenticate: (auth: HeliconeAuth, headers?: GenericHeaders) => AuthResult;
  getOrganization: (authParams: AuthParams) => OrgResult;
  getUser: (auth: JwtAuth, headers?: GenericHeaders) => HeliconeUserResult;
  createUser: ({
    email,
    password,
    otp,
  }: {
    email: string;
    password?: string;
    otp?: boolean;
  }) => HeliconeUserResult;
  getUserByEmail: (email: string) => HeliconeUserResult;
  getUserById: (userId: string) => HeliconeUserResult;
}
