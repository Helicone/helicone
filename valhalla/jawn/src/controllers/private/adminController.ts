// src/users/usersController.ts
import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Request,
  Route,
  Security,
  Tags,
} from "tsoa";
import { JawnAuthenticatedRequest } from "../../types/request";
import { IS_ON_PREM } from "../../lib/experiment/run";
import { supabaseServer } from "../../lib/db/supabase";

const authCheckThrow = async (userId: string | undefined) => {
  if (!userId) {
    throw new Error("Unauthorized");
  }
  const { data, error } = await supabaseServer.client
    .from("admins")
    .select("*");

  if (error) {
    throw new Error(error.message);
  }

  const hasAdmin = data?.map((admin) => admin.user_id).includes(userId);

  if (!hasAdmin) {
    throw new Error("Unauthorized");
  }
};

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
    authCheckThrow(request.authParams.userId);

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

  @Post("/admins/org/query")
  public async addAdminsToOrg(
    @Request() request: JawnAuthenticatedRequest,
    @Body()
    body: {
      orgId: string;
      adminIds: string[];
    }
  ): Promise<void> {
    const { orgId, adminIds } = body;

    authCheckThrow(request.authParams.userId);

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
  }

  @Post("/alert_banners")
  public async createAlertBanner(
    @Request() request: JawnAuthenticatedRequest,
    @Body()
    body: {
      title: string;
      message: string;
    }
  ): Promise<void> {
    authCheckThrow(request.authParams.userId);

    const { data, error } = await supabaseServer.client
      .from("alert_banners")
      .insert({
        title: body.title,
        message: body.message,
        active: false,
      });

    if (error) {
      throw new Error(error.message);
    }
  }

  @Patch("/alert_banners")
  public async updateAlertBanner(
    @Request() request: JawnAuthenticatedRequest,
    @Body()
    body: {
      id: number;
      active: boolean;
    }
  ): Promise<void> {
    authCheckThrow(request.authParams.userId);

    const { data, error } = await supabaseServer.client
      .from("alert_banners")
      .select("*")
      .order("created_at", { ascending: false });

    if (body.active) {
      const activeBanner = data?.find((banner) => banner.active);
      if (activeBanner) {
        throw new Error(
          "There is already an active banner. Please deactivate it first"
        );
      }
    }

    const { data: updateData, error: updateError } = await supabaseServer.client
      .from("alert_banners")
      .update({
        active: body.active,
        updated_at: new Date().toISOString(),
      })
      .match({ id: body.id });

    if (updateError) {
      throw new Error(updateError.message);
    }
  }
}
