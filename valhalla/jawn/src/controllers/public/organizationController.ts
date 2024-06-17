import {
  Route,
  Tags,
  Security,
  Controller,
  Body,
  Post,
  Request,
  Path,
  Put,
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
  UpdateOrganizationParams,
} from "../../managers/organization/OrganizationManager";

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

  @Put("/{organizationId}/update")
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

  @Post("/{organizationId}/add_member")
  public async addMemberToOrganization(
    @Body()
    requestBody: { email: string },
    @Path() organizationId: string,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<null, string>> {
    const organizationManager = new OrganizationManager(request.authParams);

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
      type: "dashboard" | "requests";
    },
    @Path() organizationId: string,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<null, string>> {
    const organizationManager = new OrganizationManager(request.authParams);

    const result = await organizationManager.createFilter(
      organizationId,
      requestBody.filters,
      requestBody.type
    );
    if (result.error || !result.data) {
      this.setStatus(500);
      return err(result.error ?? "Error creating organization filter");
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
    @Query() type: string,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<OrganizationLayout, string>> {
    const organizationManager = new OrganizationManager(request.authParams);

    const result = await organizationManager.getOrganizationLayout(
      organizationId,
      type
    );
    if (result.error || !result.data) {
      this.setStatus(500);
      return err(result.error ?? "Error getting organization layout");
    } else {
      this.setStatus(200);
      return ok(result.data);
    }
  }
}
