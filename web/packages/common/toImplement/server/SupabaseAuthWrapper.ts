import { dbExecute } from "@/lib/api/db/dbExecute";
import { getSupabaseServer } from "@/lib/supabaseServer";
import { HeliconeAuthClient } from "../../auth/server/HeliconeAuthClient";
import { AuthParams, HeliconeAuth, OrgParams } from "../../auth/types";
import { err, ok, Result } from "../../result";

export class SupabaseAuthWrapper implements HeliconeAuthClient {
  constructor() {}

  async getUserById(userId: string): Promise<Result<any, string>> {
    const supabaseServer = getSupabaseServer();
    const user = await supabaseServer.auth.admin.getUserById(userId);
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

  async getUserByEmail(email: string): Promise<Result<any, string>> {
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
    throw new Error("not implemented");
  }

  async getOrganization(
    authParams: AuthParams
  ): Promise<Result<OrgParams, string>> {
    throw new Error("not implemented");
  }
  async createUser({
    email,
    password,
    otp,
  }: {
    email: string;
    password?: string;
    otp?: boolean;
  }): Promise<Result<any, string>> {
    const supabaseServer = getSupabaseServer();
    if (otp) {
      const createUserResult = await supabaseServer.auth.signInWithOtp({
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
