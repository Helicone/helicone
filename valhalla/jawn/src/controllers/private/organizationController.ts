import {
  Body,
  Controller,
  Delete,
  Get,
  Path,
  Post,
  Query,
  Request,
  Route,
  Security,
  Tags,
} from "tsoa";
import { err, ok, Result } from "../../packages/common/result";
import { OrganizationManager } from "../../managers/organization/OrganizationManager";
import type {
  NewOrganizationParams,
  OnboardingStatus,
  OrganizationFilter,
  OrganizationLayout,
  OrganizationMember,
  OrganizationOwner,
  UpdateOrganizationParams,
} from "../../managers/organization/OrganizationManager";
import { StripeManager } from "../../managers/stripe/StripeManager";
import type { JawnAuthenticatedRequest } from "../../types/request";
import { dbExecute } from "../../lib/shared/db/dbExecute";
import { Database } from "../../lib/db/database.types";
import { RequestWrapper } from "../../lib/requestWrapper";
import { Request as ExpressRequest } from "express";
import { getHeliconeAuthClient } from "../../packages/common/auth/server/AuthClientFactory";

@Route("v1/organization")
@Tags("Organization")
@Security("api_key")
export class OrganizationController extends Controller {
  @Get("/")
  public async getOrganizations(@Request() req: ExpressRequest): Promise<
    Result<
      (Database["public"]["Tables"]["organization"]["Row"] & {
        role: string;
      })[],
      string
    >
  > {
    const request = new RequestWrapper(req);

    const authHeader = request.authHeader();
    if (authHeader.error) {
      return err(authHeader.error);
    }
    if (!authHeader.data) {
      return err("User not found");
    }

    if (authHeader.data._type !== "jwt") {
      return err("Invalid auth header");
    }

    const authParams = await getHeliconeAuthClient().getUser(
      authHeader.data,
      req.headers,
    );
    if (authParams.error || !authParams.data) {
      return err(authParams.error ?? "User not found");
    }

    const result = await dbExecute<
      Database["public"]["Tables"]["organization"]["Row"] & {
        role: string;
      }
    >(
      `SELECT DISTINCT ON (organization.id) organization.*, organization_member.org_role
      FROM organization 
      left join organization_member on organization.id = organization_member.organization
      WHERE soft_delete = false
      and (organization_member.member = $1 or organization.owner = $1)
      `,
      [authParams.data.id],
    );
    if (result.error) {
      this.setStatus(500);
      return err(result.error ?? "Error getting organizations");
    }

    return ok(result.data!);
  }

  @Get("/{organizationId}")
  public async getOrganization(
    @Path() organizationId: string,
    @Request() request: JawnAuthenticatedRequest,
  ): Promise<
    Result<Database["public"]["Tables"]["organization"]["Row"], string>
  > {
    const result = await dbExecute<
      Database["public"]["Tables"]["organization"]["Row"]
    >(
      `SELECT organization.* FROM organization 
      left join organization_member on organization.id = organization_member.organization
      WHERE soft_delete = false
      and (organization_member.member = $1 or organization.owner = $1)
      and organization.id = $2`,
      [request.authParams.userId, organizationId],
    );

    if (result.error) {
      this.setStatus(500);
      return err(result.error ?? "Error getting organization");
    }
    const org = result.data?.at(0);
    if (!org) {
      this.setStatus(404);
      return err("Organization not found");
    }

    return ok(org);
  }

  @Get("/reseller/{resellerId}")
  public async getReseller(
    @Path() resellerId: string,
    @Request() request: JawnAuthenticatedRequest,
  ) {
    const result = await dbExecute<
      Database["public"]["Tables"]["organization"]["Row"]
    >(
      `SELECT * FROM organization WHERE reseller_id = $1 and soft_delete = false`,
      [resellerId],
    );

    return ok(result);
  }

  @Post("/user/accept_terms")
  public async acceptTerms(
    @Request() request: JawnAuthenticatedRequest,
  ): Promise<Result<null, string>> {
    if (!request.authParams.userId) {
      return err("User not found");
    }

    const result = await dbExecute(
      `UPDATE auth.users
       SET raw_user_meta_data = jsonb_set(
         COALESCE(raw_user_meta_data, '{}'::jsonb),
         '{accepted_terms_date}',
         $1::jsonb
       )
       WHERE id = $2`,
      [JSON.stringify(new Date().toISOString()), request.authParams.userId],
    );

    if (result.error) {
      return err(result.error);
    }

    return ok(null);
  }

  @Post("/create")
  public async createNewOrganization(
    @Body()
    requestBody: NewOrganizationParams,
    @Request() request: JawnAuthenticatedRequest,
  ): Promise<Result<string, string>> {
    const organizationManager = new OrganizationManager(request.authParams);

    const result = await organizationManager.createOrganization(requestBody);
    if (result.error || !result.data) {
      this.setStatus(500);
      return err(result.error ?? "Error creating organization");
    } else {
      this.setStatus(201); // set return status 201
      return ok(result.data.id ?? "");
    }
  }

  @Post("/{organizationId}/update")
  public async updateOrganization(
    @Body()
    requestBody: UpdateOrganizationParams,
    @Path() organizationId: string,
    @Request() request: JawnAuthenticatedRequest,
  ): Promise<Result<null, string>> {
    const organizationManager = new OrganizationManager(request.authParams);

    const result = await organizationManager.updateOrganization(
      requestBody,
      organizationId,
    );
    if (result.error || !result.data) {
      this.setStatus(500);
      return err(result.error ?? "Error updating organization");
    } else {
      this.setStatus(201);
      return ok(null);
    }
  }

  @Post("onboard")
  public async onboardOrganization(
    @Body()
    requestBody: {},
    @Request() request: JawnAuthenticatedRequest,
  ): Promise<Result<null, string>> {
    const { error } = await dbExecute(
      `UPDATE organization
       SET has_onboarded = true
       WHERE id = $1`,
      [request.authParams.organizationId],
    );

    if (error) {
      return err(error);
    }

    return ok(null);
  }

  @Post("/{organizationId}/add_member")
  public async addMemberToOrganization(
    @Body()
    requestBody: { email: string },
    @Path() organizationId: string,
    @Request() request: JawnAuthenticatedRequest,
  ): Promise<Result<{ temporaryPassword?: string } | null, string>> {
    const organizationManager = new OrganizationManager(request.authParams);
    const org = await organizationManager.getOrg();
    if (org.error || !org.data) {
      return err(`Error getting organization: ${org.error}`);
    }

    // Check if user is already a member
    const members =
      await organizationManager.getOrganizationMembers(organizationId);
    if (members.error) {
      return err(`Error checking existing members: ${members.error}`);
    }

    const isExistingMember = members.data?.some(
      (member) =>
        member.email?.toLowerCase() === requestBody.email.toLowerCase(),
    );

    if (isExistingMember) {
      return ok(null); // Silently succeed if member already exists
    }

    if (org.data.tier === "enterprise" || org.data.tier === "team-20250130") {
      // Enterprise tier: Proceed to add member without additional checks
    } else if (
      org.data.tier === "pro-20240913" ||
      org.data.tier === "pro-20250202"
    ) {
      // Pro tier: Check seat availability before adding member
      const memberCount = await organizationManager.getMemberCount(true);
      if (
        memberCount.error ||
        memberCount.data == null ||
        memberCount.data < 0
      ) {
        return err(memberCount.error ?? "Error getting member count");
      }

      // Check purchased seats
      const stripeManager = new StripeManager(request.authParams);
      const purchasedSeats = await stripeManager.getPurchasedSeatCount();
      if (purchasedSeats.error || purchasedSeats.data == null) {
        return err(purchasedSeats.error ?? "Error getting purchased seats");
      }

      // Automatically purchase more seats if needed
      if (memberCount.data + 1 > purchasedSeats.data) {
        const updateResult = await stripeManager.updateProUserCount(
          memberCount.data + 1,
        );
        if (updateResult.error) {
          return err("Failed to purchase additional seats");
        }
      }

      // Update Stripe user count
      const userCount = await stripeManager.updateProUserCount(
        memberCount.data + 1,
      );

      if (userCount.error) {
        return err(userCount.error ?? "Error updating pro user count");
      }
    }

    const result = await organizationManager.addMember(
      organizationId,
      requestBody.email,
    );

    if (result.error || !result.data) {
      this.setStatus(500);
      return err(result.error ?? "Error adding member to organization");
    } else {
      this.setStatus(201);
      return ok(result.data);
    }
  }

  @Post("/{organizationId}/create_filter")
  public async createOrganizationFilter(
    @Body()
    requestBody: {
      filters: OrganizationFilter[];
      filterType: "dashboard" | "requests";
    },
    @Path() organizationId: string,
    @Request() request: JawnAuthenticatedRequest,
  ): Promise<Result<null, string>> {
    const organizationManager = new OrganizationManager(request.authParams);

    const result = await organizationManager.createFilter(
      organizationId,
      requestBody.filters,
      requestBody.filterType,
    );
    if (result.error || !result.data) {
      this.setStatus(500);
      return err(result.error ?? "Error creating organization filter");
    } else {
      this.setStatus(201);
      return ok(null);
    }
  }

  @Post("/{organizationId}/update_filter")
  public async updateOrganizationFilter(
    @Body()
    requestBody: {
      filters: OrganizationFilter[];
      filterType: "dashboard" | "requests";
    },
    @Path() organizationId: string,
    @Request() request: JawnAuthenticatedRequest,
  ): Promise<Result<null, string>> {
    const organizationManager = new OrganizationManager(request.authParams);

    const result = await organizationManager.updateFilter(
      organizationId,
      requestBody.filterType,
      requestBody.filters,
    );
    if (result.error || !result.data) {
      this.setStatus(500);
      return err(result.error ?? "Error updating organization filter");
    } else {
      this.setStatus(201);
      return ok(null);
    }
  }

  @Delete("/delete")
  public async deleteOrganization(
    @Request() request: JawnAuthenticatedRequest,
  ): Promise<Result<null, string>> {
    const organizationManager = new OrganizationManager(request.authParams);

    const result = await organizationManager.deleteOrganization();
    if (result.error || !result.data) {
      this.setStatus(500);
      return err(result.error ?? "Error deleting organization");
    } else {
      this.setStatus(201);
      return ok(null);
    }
  }

  @Get("/{organizationId}/layout")
  public async getOrganizationLayout(
    @Path() organizationId: string,
    @Query() filterType: string,
    @Request() request: JawnAuthenticatedRequest,
  ): Promise<Result<OrganizationLayout, string>> {
    const organizationManager = new OrganizationManager(request.authParams);

    const result = await organizationManager.getOrganizationLayout(
      organizationId,
      filterType,
    );
    if (result.error || !result.data) {
      this.setStatus(500);
      return err(result.error ?? "Error getting organization layout");
    } else {
      this.setStatus(200);
      return ok(result.data);
    }
  }

  @Get("/{organizationId}/members")
  public async getOrganizationMembers(
    @Path() organizationId: string,
    @Request() request: JawnAuthenticatedRequest,
  ): Promise<Result<OrganizationMember[], string>> {
    const organizationManager = new OrganizationManager(request.authParams);

    const result =
      await organizationManager.getOrganizationMembers(organizationId);
    if (result.error || !result.data) {
      this.setStatus(500);
      return err(result.error ?? "Error getting organization members");
    } else {
      this.setStatus(200);
      return ok(result.data);
    }
  }

  @Post("/{organizationId}/update_member")
  public async updateOrganizationMember(
    @Body()
    requestBody: { role: string; memberId: string },
    @Path() organizationId: string,
    @Request() request: JawnAuthenticatedRequest,
  ): Promise<Result<null, string>> {
    const organizationManager = new OrganizationManager(request.authParams);

    const result = await organizationManager.updateMember(
      organizationId,
      requestBody.role,
      requestBody.memberId,
    );
    if (result.error || !result.data) {
      this.setStatus(500);
      return err(result.error ?? "Error updating organization member");
    } else {
      this.setStatus(201);
      return ok(null);
    }
  }

  @Post("/{organizationId}/update_owner")
  public async updateOrganizationOwner(
    @Body()
    requestBody: { memberId: string },
    @Path() organizationId: string,
    @Request() request: JawnAuthenticatedRequest,
  ): Promise<Result<null, string>> {
    const organizationManager = new OrganizationManager(request.authParams);

    const result = await organizationManager.updateOwner(
      organizationId,
      requestBody.memberId,
    );
    if (result.error || !result.data) {
      this.setStatus(500);
      return err(result.error ?? "Error updating organization owner");
    } else {
      this.setStatus(201);
      return ok(null);
    }
  }

  @Get("/{organizationId}/owner")
  public async getOrganizationOwner(
    @Path() organizationId: string,
    @Request() request: JawnAuthenticatedRequest,
  ): Promise<Result<OrganizationOwner[], string>> {
    const organizationManager = new OrganizationManager(request.authParams);

    const result =
      await organizationManager.getOrganizationOwner(organizationId);
    if (result.error || !result.data) {
      this.setStatus(500);
      return err(result.error ?? "Error getting organization owner");
    } else {
      this.setStatus(200);
      return ok(result.data);
    }
  }

  @Delete("/{organizationId}/remove_member")
  public async removeMemberFromOrganization(
    @Path() organizationId: string,
    @Query() memberId: string,
    @Request() request: JawnAuthenticatedRequest,
  ): Promise<Result<null, string>> {
    const stripeManager = new StripeManager(request.authParams);
    const organizationManager = new OrganizationManager(request.authParams);

    const memberCount = await organizationManager.getMemberCount(true);
    if (memberCount.error || memberCount.data == null || memberCount.data < 0) {
      return err(memberCount.error ?? "Error getting member count");
    }

    const org = await organizationManager.getOrg();
    if (org.error || !org.data) {
      return err(org.error ?? "Error getting organization");
    }

    if (
      memberCount.data > 0 &&
      org.data.tier != "free" &&
      org.data.tier != "team-20250130" &&
      org.data.tier != "enterprise"
    ) {
      const userCount = await stripeManager.updateProUserCount(
        memberCount.data - 1,
      );

      if (userCount.error) {
        return err(userCount.error ?? "Error updating pro user count");
      }
    }

    const result = await organizationManager.removeOrganizationMember(
      organizationId,
      memberId,
    );
    if (result.error || !result.data) {
      this.setStatus(500);
      return err(result.error ?? "Error removing member from organization");
    } else {
      this.setStatus(201);
      return ok(null);
    }
  }

  @Post("/setup-demo")
  public async setupDemo(
    @Request() request: JawnAuthenticatedRequest,
  ): Promise<Result<null, string>> {
    const organizationManager = new OrganizationManager(request.authParams);

    const demoOrg = await dbExecute<
      Database["public"]["Tables"]["organization"]["Row"]
    >(
      `SELECT DISTINCT ON (organization.id) organization.* 
      FROM organization 
      left join organization_member on organization.id = organization_member.organization
      WHERE tier = 'demo' 
      and coalesce((onboarding_status->>'demoDataSetup')::boolean, false) != true
      and (organization_member.member = $1 or organization.owner = $1)
      limit 1
      `,
      [request.authParams.userId],
    );

    if (demoOrg.error || !demoOrg.data) {
      return err(demoOrg.error ?? "Error getting demo organization");
    }

    if (demoOrg.data.length === 0) {
      return err("No demo organization found");
    }

    const result = await organizationManager.setupDemo(demoOrg.data[0].id);
    if (result.error) {
      this.setStatus(500);
      console.error(result.error);
      return err(result.error ?? "Error setting up demo");
    } else {
      this.setStatus(201);
      return ok(null);
    }
  }

  @Post("/update_onboarding")
  public async updateOnboardingStatus(
    @Body()
    requestBody: {
      onboarding_status: OnboardingStatus;
      name: string;
    },
    @Request() request: JawnAuthenticatedRequest,
  ): Promise<Result<null, string>> {
    const organizationManager = new OrganizationManager(request.authParams);

    const result = await organizationManager.updateOnboardingStatus(
      request.authParams.organizationId ?? "",
      requestBody.onboarding_status,
      requestBody.name,
    );

    if (result.error) {
      this.setStatus(500);
      return err(result.error ?? "Error updating onboarding status");
    } else {
      this.setStatus(201);
      return ok(null);
    }
  }
}
