import {
  AuthParams,
  AuthResult,
  HeliconeAuth,
  HeliconeUserResult,
  OrgResult,
} from "../types";

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
  getUserByEmail: (email: string) => HeliconeUserResult;
  getUserById: (userId: string) => HeliconeUserResult;
}
