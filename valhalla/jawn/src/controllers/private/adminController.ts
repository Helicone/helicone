// src/users/usersController.ts
import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  Route,
  Security,
  Tags,
} from "tsoa";
import { JawnAuthenticatedRequest } from "../../types/request";
import { IS_ON_PREM } from "../../lib/experiment/run";
import { supabaseServer } from "../../lib/db/supabase";

@Route("v1/admin")
@Tags("Admin")
@Security("api_key")
export class AdminController extends Controller {
  @Get("/admins/query")
  public async getAdmins(@Request() request: JawnAuthenticatedRequest): Promise<
    {
      created_at: string;
      id: number;
      user_email: string | null;
      user_id: string | null;
    }[]
  > {
    const { data, error } = await supabaseServer.client
      .from("admins")
      .select("*");

    return data ?? [];
  }

  @Post("/orgs/query")
  public async findAllOrgs(
    @Request() request: JawnAuthenticatedRequest,
    @Body()
    body: {
      orgName: string;
    }
  ): Promise<{
    orgs: {
      name: string;
      id: string;
    }[];
  }> {
    if (!request.authParams.userId) {
      return {
        orgs: [],
      };
    }
    const { data: admins, error: adminsError } = await supabaseServer.client
      .from("admins")
      .select("*");

    if (
      admins?.map((admin) => admin.user_id).includes(request.authParams.userId)
    ) {
      const { data, error } = await supabaseServer.client
        .from("organization")
        .select("*")
        .ilike("name", `%${body.orgName}%`);
      return {
        orgs:
          data?.map((org) => ({
            name: org.name,
            id: org.id,
          })) ?? [],
      };
    } else {
      throw new Error("Unauthorized");
    }
  }

  @Post("/admins/org/query")
  public async addAdminsToOrg(
    @Request() request: JawnAuthenticatedRequest,
    @Body()
    body: {
      orgId: string;
      adminIds: string[];
    }
  ): Promise<void> {
    if (!request.authParams.userId) {
      return;
    }

    const { orgId, adminIds } = body;

    const { data: admins, error: adminsError } = await supabaseServer.client
      .from("admins")
      .select("*");

    if (
      admins?.map((admin) => admin.user_id).includes(request.authParams.userId)
    ) {
      const { data, error } = await supabaseServer.client
        .from("organization_member")
        .insert(
          adminIds.map((adminId) => ({
            organization: orgId,
            member: adminId,
            org_role: "admin",
          }))
        );

      if (error) {
        throw new Error(error.message);
      }

      return;
    } else {
      throw new Error("Unauthorized");
    }
  }
}
