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
import { Result } from "../../lib/shared/result";
import { JawnAuthenticatedRequest } from "../../types/request";
import {
  CreateSavedFilterRequest,
  SavedFilter,
  SavedFilterManager,
  UpdateSavedFilterRequest,
} from "../../managers/filter/SavedFilterManager";

@Route("v1/saved-filters")
@Tags("SavedFilters")
@Security("api_key")
export class SavedFilterController extends Controller {
  /**
   * Get all saved filters for the current organization
   */
  @Get()
  public async getSavedFilters(
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<SavedFilter[], string>> {
    const filterManager = new SavedFilterManager(request.authParams);
    const filters = await filterManager.getSavedFilters();

    if (filters.error) {
      this.setStatus(500);
    } else {
      this.setStatus(200);
    }

    return filters;
  }

  /**
   * Get a saved filter by ID
   */
  @Get("{filterId}")
  public async getSavedFilterById(
    @Path() filterId: string,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<SavedFilter, string>> {
    const filterManager = new SavedFilterManager(request.authParams);
    const filter = await filterManager.getSavedFilterById(filterId);

    if (filter.error) {
      this.setStatus(filter.error === "Saved filter not found" ? 404 : 500);
    } else {
      this.setStatus(200);
    }

    return filter;
  }

  /**
   * Create a new saved filter
   */
  @Post()
  public async createSavedFilter(
    @Body() requestBody: CreateSavedFilterRequest,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<{ id: string }, string>> {
    const filterManager = new SavedFilterManager(request.authParams);
    const result = await filterManager.createSavedFilter(requestBody);

    if (result.error) {
      this.setStatus(500);
    } else {
      this.setStatus(201);
    }

    return result;
  }

  /**
   * Update a saved filter
   */
  @Put("{filterId}")
  public async updateSavedFilter(
    @Path() filterId: string,
    @Body() requestBody: UpdateSavedFilterRequest,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<null, string>> {
    const filterManager = new SavedFilterManager(request.authParams);
    const result = await filterManager.updateSavedFilter(filterId, requestBody);

    if (result.error) {
      this.setStatus(result.error === "Saved filter not found" ? 404 : 500);
    } else {
      this.setStatus(200);
    }

    return result;
  }

  /**
   * Delete a saved filter
   */
  @Delete("{filterId}")
  public async deleteSavedFilter(
    @Path() filterId: string,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<null, string>> {
    const filterManager = new SavedFilterManager(request.authParams);
    const result = await filterManager.deleteSavedFilter(filterId);

    if (result.error) {
      this.setStatus(result.error === "Saved filter not found" ? 404 : 500);
    } else {
      this.setStatus(204);
    }

    return result;
  }

  /**
   * Update the last_used timestamp of a saved filter
   */
  @Post("{filterId}/use")
  public async updateLastUsed(
    @Path() filterId: string,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<null, string>> {
    const filterManager = new SavedFilterManager(request.authParams);
    const result = await filterManager.updateLastUsed(filterId);

    if (result.error) {
      this.setStatus(result.error === "Saved filter not found" ? 404 : 500);
    } else {
      this.setStatus(200);
    }

    return result;
  }
}
