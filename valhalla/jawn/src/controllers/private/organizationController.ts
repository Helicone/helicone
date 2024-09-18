import {
  Route,
  Tags,
  Security,
  Controller,
  Body,
  Post,
  Request,
  Path,
  Delete,
  Get,
  Query,
} from "tsoa";
import { err, ok, Result } from "../../lib/shared/result";
import { JawnAuthenticatedRequest } from "../../types/request";
import {
  NewOrganizationParams,
  OrganizationFilter,
  OrganizationLayout,
  OrganizationManager,
  OrganizationMember,
  OrganizationOwner,
  UpdateOrganizationParams,
} from "../../managers/organization/OrganizationManager";
import { supabaseServer } from "../../lib/db/supabase";
import { StripeManager } from "../../managers/stripe/StripeManager";

@Route("v1/organization")
@Tags("Organization")
@Security("api_key")
export class OrganizationController extends Controller {
  @Post("/create")
  public async createNewOrganization(
    @Body()
    requestBody: NewOrganizationParams,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<null, string>> {
    const organizationManager = new OrganizationManager(request.authParams);

    const result = await organizationManager.createOrganization(requestBody);
    if (result.error || !result.data) {
      this.setStatus(500);
      return err(result.error ?? "Error creating organization");
    } else {
      this.setStatus(201); // set return status 201
      return ok(null);
    }
  }

  @Post("/{organizationId}/update")
  public async updateOrganization(
    @Body()
    requestBody: UpdateOrganizationParams,
    @Path() organizationId: string,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<null, string>> {
    const organizationManager = new OrganizationManager(request.authParams);

    const result = await organizationManager.updateOrganization(
      requestBody,
      organizationId
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
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<null, string>> {
    await supabaseServer.client
      .from("organization")
      .update({
        has_onboarded: true,
      })
      .eq("id", request.authParams.organizationId);

    return ok(null);
  }

  @Post("/{organizationId}/add_member")
  public async addMemberToOrganization(
    @Body()
    requestBody: { email: string },
    @Path() organizationId: string,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<null, string>> {
    const organizationManager = new OrganizationManager(request.authParams);
    const memberCount = await organizationManager.getMemberCount();
    if (memberCount.error || !memberCount.data) {
      return err(memberCount.error ?? "Error getting member count");
    }

    const stripeManager = new StripeManager(request.authParams);

    const userCount = await stripeManager.updateProUserCount(
      memberCount.data + 1
    );

    if (userCount.error) {
      return err(userCount.error ?? "Error updating pro user count");
    }

    const result = await organizationManager.addMember(
      organizationId,
      requestBody.email
    );

    if (result.error || !result.data) {
      this.setStatus(500);
      return err(result.error ?? "Error adding member to organization");
    } else {
      this.setStatus(201);
      return ok(null);
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
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<null, string>> {
    const organizationManager = new OrganizationManager(request.authParams);

    const result = await organizationManager.createFilter(
      organizationId,
      requestBody.filters,
      requestBody.filterType
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
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<null, string>> {
    const organizationManager = new OrganizationManager(request.authParams);

    const result = await organizationManager.updateFilter(
      organizationId,
      requestBody.filterType,
      requestBody.filters
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
    @Request() request: JawnAuthenticatedRequest
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
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<OrganizationLayout, string>> {
    const organizationManager = new OrganizationManager(request.authParams);

    const result = await organizationManager.getOrganizationLayout(
      organizationId,
      filterType
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
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<OrganizationMember[], string>> {
    const organizationManager = new OrganizationManager(request.authParams);

    const result = await organizationManager.getOrganizationMembers(
      organizationId
    );
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
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<null, string>> {
    const organizationManager = new OrganizationManager(request.authParams);

    const result = await organizationManager.updateMember(
      organizationId,
      requestBody.role,
      requestBody.memberId
    );
    if (result.error || !result.data) {
      this.setStatus(500);
      return err(result.error ?? "Error updating organization member");
    } else {
      this.setStatus(201);
      return ok(null);
    }
  }

  @Get("/{organizationId}/owner")
  public async getOrganizationOwner(
    @Path() organizationId: string,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<OrganizationOwner[], string>> {
    const organizationManager = new OrganizationManager(request.authParams);

    const result = await organizationManager.getOrganizationOwner(
      organizationId
    );
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
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<null, string>> {
    const stripeManager = new StripeManager(request.authParams);
    const organizationManager = new OrganizationManager(request.authParams);

    const memberCount = await organizationManager.getMemberCount();
    if (memberCount.error || !memberCount.data) {
      return err(memberCount.error ?? "Error getting member count");
    }

    const userCount = await stripeManager.updateProUserCount(
      memberCount.data - 1
    );

    if (userCount.error) {
      return err(userCount.error ?? "Error updating pro user count");
    }

    const result = await organizationManager.removeOrganizationMember(
      organizationId,
      memberId
    );
    if (result.error || !result.data) {
      this.setStatus(500);
      return err(result.error ?? "Error removing member from organization");
    } else {
      this.setStatus(201);
      return ok(null);
    }
  }
}
