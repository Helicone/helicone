import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  Route,
  Security,
  Tags,
} from "tsoa";
import { dbExecute } from "../../../lib/shared/db/dbExecute";
import { JawnAuthenticatedRequest } from "../../../types/request";

@Route("v1/router/control-plane")
@Tags("Router Control Plane")
@Security("api_key")
export class RouterControlPlaneController extends Controller {
  @Get("/whoami")
  public async whoami(@Request() request: JawnAuthenticatedRequest): Promise<{
    userId: string;
    organizationId: string;
  }> {
    return {
      userId: request.authParams.userId ?? "",
      organizationId: request.authParams.organizationId,
    };
  }
}
