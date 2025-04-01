import { supabaseServer } from "../../db/supabase";
import { HeliconeAuth } from "../../requestWrapper";
import { dbExecute } from "../db/dbExecute";
import { err, ok, Result } from "../result";
import {
  AuthParams,
  HeliconeAuthClient,
  HeliconeUserResult,
  OrgParams,
} from "./HeliconeAuthClient";

export class SupabaseAuthWrapper implements HeliconeAuthClient {
  constructor() {}

  async getUserById(userId: string): HeliconeUserResult {
    const user = await supabaseServer.client.auth.admin.getUserById(userId);
    if (user.error) {
      return err(user.error.message);
    }
    if (!user.data.user.email) {
      return err("User not found");
    }
    return ok({
      email: user.data.user.email,
      id: userId,
    });
  }
  async getUserByEmail(email: string): HeliconeUserResult {
    const getUserIdQuery = `
      SELECT id FROM auth.users WHERE email = $1 LIMIT 1
    `;
    let { data: userId, error: userIdError } = await dbExecute<{ id: string }>(
      getUserIdQuery,
      [email]
    );

    if (userIdError) {
      return err(userIdError ?? "User not found");
    }

    if (!userId || userId.length === 0) {
      return err("User not found");
    }

    return ok({
      email,
      id: userId[0].id,
    });
  }

  async authenticate(auth: HeliconeAuth): Promise<Result<AuthParams, string>> {
    return await supabaseServer.authenticate(auth);
  }
  async getOrganization(
    authParams: AuthParams
  ): Promise<Result<OrgParams, string>> {
    return await supabaseServer.getOrganization(authParams);
  }
  async createUser({
    email,
    password,
    otp,
  }: {
    email: string;
    password?: string;
    otp?: boolean;
  }): HeliconeUserResult {
    if (otp) {
      const createUserResult = await supabaseServer.client.auth.signInWithOtp({
        email,
      });
      if (createUserResult.error) {
        return err(createUserResult.error.message);
      }

      return await this.getUserByEmail(email);
    } else {
      throw new Error("not implemented");
    }
  }
}
