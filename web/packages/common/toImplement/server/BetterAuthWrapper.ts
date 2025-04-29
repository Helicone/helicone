import {
  GenericHeaders,
  HeliconeAuthClient,
} from "../../auth/server/HeliconeAuthClient";
import {
  AuthParams,
  AuthResult,
  HeliconeAuth,
  HeliconeUserResult,
  JwtAuth,
  OrgResult,
} from "../../auth/types";

export class BetterAuthWrapper implements HeliconeAuthClient {
  constructor() {}

  authenticate(auth: HeliconeAuth, header?: GenericHeaders): AuthResult {
    throw new Error("Method 'authenticate' not implemented.");
  }

  getOrganization(authParams: AuthParams): OrgResult {
    throw new Error("Method 'getOrganization' not implemented.");
  }

  getUser(auth: JwtAuth, headers?: GenericHeaders): HeliconeUserResult {
    throw new Error("Method 'getUser' not implemented.");
  }

  createUser({
    email,
    password,
    otp,
  }: {
    email: string;
    password?: string;
    otp?: boolean;
  }): HeliconeUserResult {
    throw new Error("Method 'createUser' not implemented.");
  }

  getUserByEmail(email: string): HeliconeUserResult {
    throw new Error("Method 'getUserByEmail' not implemented.");
  }

  getUserById(userId: string): HeliconeUserResult {
    throw new Error("Method 'getUserById' not implemented.");
  }
}
