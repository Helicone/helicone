import {
  AuthParams,
  AuthResult,
  HeliconeAuth,
  HeliconeUserResult,
  JwtAuth,
  OrgResult,
} from "../types";

export interface HeliconeAuthClient {
  authenticate: (auth: HeliconeAuth) => AuthResult;
  getOrganization: (authParams: AuthParams) => OrgResult;
  getUser(auth: JwtAuth): HeliconeUserResult;
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
