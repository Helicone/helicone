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
import { dbExecute } from "../../lib/shared/db/dbExecute";
import { err, ok, Result } from "../../packages/common/result";
import { type JawnAuthenticatedRequest } from "../../types/request";

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
    },
  ) {
    const isAdminResult = await dbExecute<{
      id: string;
      organization: string;
      member: string;
      org_role: string;
    }>(
      `SELECT *
       FROM organization_member
       WHERE organization = $1
       AND member = $2
       AND (org_role = 'admin' OR org_role = 'owner')`,
      [request.authParams.organizationId, request.authParams.userId!],
    );

    if (
      isAdminResult.error ||
      !isAdminResult.data ||
      isAdminResult.data.length === 0
    ) {
      return err("User is not an admin");
    }

    const { error } = await dbExecute(
      `UPDATE organization_member
       SET governance_limits = $1
       WHERE member = $2
       AND organization = $3`,
      [
        { limitUSD: body.limitUSD, days: body.days },
        memberId,
        request.authParams.organizationId,
      ],
    );

    if (error) {
      return err(error);
    }

    return ok(null);
  }

  @Get("/my-limits")
  public async getMyLimits(@Request() request: JawnAuthenticatedRequest) {
    const result = await dbExecute<{
      id: string;
      organization: string;
      member: string;
      org_role: string;
      governance_limits: any;
    }>(
      `SELECT *
       FROM organization_member
       WHERE member = $1
       AND organization = $2`,
      [request.authParams.userId!, request.authParams.organizationId],
    );

    if (result.error || !result.data || result.data.length === 0) {
      return err("Failed to get member limits");
    }

    return ok(result.data[0]);
  }

  @Get("/limits/member/{memberId}")
  public async getMemberLimits(
    @Request() request: JawnAuthenticatedRequest,
    @Path() memberId: string,
  ) {
    const result = await dbExecute<{
      id: string;
      organization: string;
      member: string;
      org_role: string;
      governance_limits: any;
    }>(
      `SELECT *
       FROM organization_member
       WHERE member = $1
       AND organization = $2`,
      [memberId, request.authParams.organizationId],
    );

    if (result.error || !result.data || result.data.length === 0) {
      return err("Failed to get member limits");
    }

    return ok(result.data[0]);
  }

  @Get("is-governance-org")
  public async isGovernanceOrg(@Request() request: JawnAuthenticatedRequest) {
    const result = await dbExecute<{
      governance_settings: any;
    }>(
      `SELECT governance_settings
       FROM organization
       WHERE id = $1
       AND governance_settings IS NOT NULL`,
      [request.authParams.organizationId],
    );

    if (result.error || !result.data || result.data.length === 0) {
      return err("Not a governance org");
    }

    return ok(result.data[0]);
  }
}
