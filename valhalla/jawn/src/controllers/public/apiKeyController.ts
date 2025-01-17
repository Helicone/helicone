import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Path,
  Query,
  Request,
  Route,
  Security,
  Tags,
} from "tsoa";
import { supabaseServer } from "../../lib/db/supabase";
import { JawnAuthenticatedRequest } from "../../types/request";

@Route("v1/api-keys")
@Tags("API Key")
@Security("api_key")
export class ApiKeyController extends Controller {
  @Get("/")
  public async getAPIKeys(
    @Request() request: JawnAuthenticatedRequest,
    @Query() governance: string
  ) {
    const queryBuilder = supabaseServer.client
      .from("helicone_api_keys")
      .select("*")
      .eq("soft_delete", false)
      .neq("api_key_name", "auto-generated-experiment-key")
      .eq("temp_key", false)
      .eq("organization_id", request.authParams.organizationId);

    if (governance === "true") {
      queryBuilder.eq("governance", true);
    }

    const res = await queryBuilder;
    return res;
  }

  @Delete("/{apiKeyId}")
  public async deleteAPIKey(
    @Request() request: JawnAuthenticatedRequest,
    @Path() apiKeyId: string
  ) {
    const { data, error } = await supabaseServer.client
      .from("helicone_api_keys")
      .update({
        soft_delete: true,
      })
      .eq("id", apiKeyId)
      .eq("organization_id", request.authParams.organizationId);

    if (error) {
      this.setStatus(500);
      return { error: error.message };
    }

    return data;
  }

  @Patch("/{apiKeyId}")
  public async updateAPIKey(
    @Request() request: JawnAuthenticatedRequest,
    @Path() apiKeyId: string,
    @Body() body: { api_key_name: string }
  ) {
    const { data, error } = await supabaseServer.client
      .from("helicone_api_keys")
      .update({
        api_key_name: body.api_key_name,
      })
      .eq("id", apiKeyId)
      .eq("organization_id", request.authParams.organizationId);

    if (error) {
      this.setStatus(500);
      return { error: error.message };
    }

    return data;
  }
}
