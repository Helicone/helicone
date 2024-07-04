import { Body, Controller, Post, Request, Route, Security, Tags } from "tsoa";
import { supabaseServer } from "../../lib/routers/withAuth";
import { JawnAuthenticatedRequest } from "../../types/request";

export interface PropertiesQueryParams {
  propertyToHide: string;
}

@Route("v1/properties")
@Tags("Properties")
@Security("api_key")
export class PropertiesController extends Controller {
  @Post("hide")
  public async hide(
    @Body()
    requestBody: PropertiesQueryParams,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<{
    success?: boolean;
    error?: {
      message?: string;
      details?: string;
    };
  }> {
    const { propertyToHide } = requestBody;
    try {
      const insertRes = await supabaseServer.client
        .from("hidden_properties")
        .insert({
          org_id: request.authParams.organizationId,
          property_to_hide: propertyToHide,
        });

      if (insertRes.error) {
        this.setStatus(500);
        return {
          error: {
            message: "Failed to hide property",
            details: insertRes.error.message,
          },
        };
      }

      this.setStatus(201);
      return {
        success: true,
      };
    } catch (error: any) {
      console.log(`Failed to hide property: ${error}`);
      this.setStatus(500);
      return {
        error: {
          message: "Failed to hide property",
          details: error.message,
        },
      };
    }
  }
}
