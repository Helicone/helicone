import {
  Body,
  Controller,
  Get,
  Path,
  Post,
  Request,
  Route,
  Security,
  Tags,
} from "tsoa";
import { supabaseServer } from "../../lib/db/supabase";
import { err, ok } from "../../lib/shared/result";
import { JawnAuthenticatedRequest } from "../../types/request";

@Route("v1/gov-organization")
@Tags("Gov Organization")
@Security("api_key")
export class GovOrganizationController extends Controller {
  @Post("/limits/member/{memberId}")
  public async setMemberLimits(
    @Request() request: JawnAuthenticatedRequest,
    @Path() memberId: string,
    @Body()
    body: {
      limitUSD: number;
      days: number;
    }
  ) {
    const isAdmin = await supabaseServer.client
      .from("organization_member")
      .select("*")
      .or("org_role.eq.admin,org_role.eq.owner")
      .eq("organization", request.authParams.organizationId)
      .eq("member", request.authParams.userId!)
      .single();

    if (!isAdmin.data) {
      return err("User is not an admin");
    }

    const res = await supabaseServer.client
      .from("organization_member")
      .update({
        governance_limits: {
          limitUSD: body.limitUSD,
          days: body.days,
        },
      })
      .eq("member", memberId)
      .eq("organization", request.authParams.organizationId);
    if (res.error) {
      return err(res.error.message);
    }

    return ok(res.data);
  }

  @Get("/my-limits")
  public async getMyLimits(@Request() request: JawnAuthenticatedRequest) {
    return supabaseServer.client
      .from("organization_member")
      .select("*")
      .eq("member", request.authParams.userId!)
      .eq("organization", request.authParams.organizationId)
      .single();
  }

  @Get("/limits/member/{memberId}")
  public async getMemberLimits(
    @Request() request: JawnAuthenticatedRequest,
    @Path() memberId: string
  ) {
    return supabaseServer.client
      .from("organization_member")
      .select("*")
      .eq("member", memberId)
      .eq("organization", request.authParams.organizationId)
      .single();
  }

  @Get("is-governance-org")
  public async isGovernanceOrg(@Request() request: JawnAuthenticatedRequest) {
    return await supabaseServer.client
      .from("organization")
      .select("governance_settings")
      .eq("id", request.authParams.organizationId)
      .not("governance_settings", "is", null)
      .single();
  }
}
