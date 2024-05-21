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
  public async getAdmins(
    @Request() request: JawnAuthenticatedRequest
  ): Promise<string[]> {
    const { data, error } = await supabaseServer.client
      .from("admins")
      .select("*");

    return data?.map((admin) => admin.user_id || "") ?? [];
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
    }
    return {
      orgs: [],
    };
  }
}
