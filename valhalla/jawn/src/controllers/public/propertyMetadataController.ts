import {
  Body,
  Controller,
  Delete,
  Get,
  Path,
  Post,
  Put,
  Request,
  Route,
  Security,
  Tags,
} from "tsoa";
import { JawnAuthenticatedRequest } from "../../types/request";
import {
  CreatePropertyMetadataParams,
  PropertyMetadata,
  PropertyMetadataManager,
  UpdatePropertyMetadataParams,
} from "../../managers/PropertyMetadataManager";

export interface PropertyMetadataResponse {
  id: string;
  created_at: string;
  updated_at: string;
  property_key: string;
  description: string | null;
  soft_delete: boolean;
  deleted_at: string | null;
}

@Route("v1/property-metadata")
@Tags("Property Metadata")
@Security("api_key")
export class PropertyMetadataController extends Controller {
  /**
   * Get all property metadata for the authenticated organization
   */
  @Get()
  public async getAllPropertyMetadata(
    @Request() request: JawnAuthenticatedRequest
  ) {
    const manager = new PropertyMetadataManager(request.authParams);
    const result = await manager.getAllPropertyMetadata();

    if (result.error) {
      this.setStatus(400);
      return { error: result.error };
    }

    return {
      data: result.data!.map(
        (metadata): PropertyMetadataResponse => ({
          id: metadata.id,
          created_at: metadata.created_at,
          updated_at: metadata.updated_at,
          property_key: metadata.property_key,
          description: metadata.description,
          soft_delete: metadata.soft_delete,
          deleted_at: metadata.deleted_at,
        })
      ),
    };
  }

  /**
   * Get property metadata by key
   */
  @Get("{propertyKey}")
  public async getPropertyMetadataByKey(
    @Path() propertyKey: string,
    @Request() request: JawnAuthenticatedRequest
  ) {
    const manager = new PropertyMetadataManager(request.authParams);
    const result = await manager.getPropertyMetadataByKey(propertyKey);

    if (result.error) {
      this.setStatus(400);
      return { error: result.error };
    }

    return {
      data: {
        id: result.data!.id,
        created_at: result.data!.created_at,
        updated_at: result.data!.updated_at,
        property_key: result.data!.property_key,
        description: result.data!.description,
        soft_delete: result.data!.soft_delete,
        deleted_at: result.data!.deleted_at,
      },
    };
  }

  /**
   * Create property metadata
   */
  @Post()
  public async createPropertyMetadata(
    @Body() requestBody: CreatePropertyMetadataParams,
    @Request() request: JawnAuthenticatedRequest
  ) {
    const manager = new PropertyMetadataManager(request.authParams);
    const result = await manager.createPropertyMetadata(requestBody);

    if (result.error) {
      this.setStatus(400);
      return { error: result.error };
    }

    return {
      data: {
        id: result.data!.id,
        created_at: result.data!.created_at,
        updated_at: result.data!.updated_at,
        property_key: result.data!.property_key,
        description: result.data!.description,
        soft_delete: result.data!.soft_delete,
        deleted_at: result.data!.deleted_at,
      },
    };
  }

  /**
   * Update property metadata
   */
  @Put("{propertyKey}")
  public async updatePropertyMetadata(
    @Path() propertyKey: string,
    @Body() requestBody: UpdatePropertyMetadataParams,
    @Request() request: JawnAuthenticatedRequest
  ) {
    const manager = new PropertyMetadataManager(request.authParams);
    const result = await manager.updatePropertyMetadata(
      propertyKey,
      requestBody
    );

    if (result.error) {
      this.setStatus(400);
      return { error: result.error };
    }

    return {
      data: {
        id: result.data!.id,
        created_at: result.data!.created_at,
        updated_at: result.data!.updated_at,
        property_key: result.data!.property_key,
        description: result.data!.description,
        soft_delete: result.data!.soft_delete,
        deleted_at: result.data!.deleted_at,
      },
    };
  }

  /**
   * Delete property metadata
   */
  @Delete("{propertyKey}")
  public async deletePropertyMetadata(
    @Path() propertyKey: string,
    @Request() request: JawnAuthenticatedRequest
  ) {
    const manager = new PropertyMetadataManager(request.authParams);
    const result = await manager.deletePropertyMetadata(propertyKey);

    if (result.error) {
      this.setStatus(400);
      return { error: result.error };
    }

    return {
      data: { success: true },
    };
  }
}
