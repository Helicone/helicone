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
import { ControlPlaneManager } from "../../../managers/router/ControlPlaneManager";
import type { JawnAuthenticatedRequest } from "../../../types/request";
import { err, ok, Result } from "../../../packages/common/result";

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

  @Post("/sign-s3-url")
  public async signS3Url(
    @Request() request: JawnAuthenticatedRequest,
    @Body()
    body: {
      requestId: string;
      payloadSize: number;
    },
  ): Promise<
    Result<
      {
        url: string;
      },
      string
    >
  > {
    const controlPlaneManager = new ControlPlaneManager(request.authParams);
    const { requestId, payloadSize } = body;
    // if payload is larger than 10MB, return 400
    const MAX_PAYLOAD_SIZE = 10 * 1024 * 1024;
    if (payloadSize >= MAX_PAYLOAD_SIZE) {
      this.setStatus(400);
      return err("Payload size is too large");
    }
    let signedUrl = await controlPlaneManager.signS3Url(
      requestId,
      payloadSize,
      request.authParams,
    );
    if (signedUrl.error) {
      this.setStatus(500);
      return err(signedUrl.error);
    } else {
      return ok({
        url: signedUrl.data!,
      });
    }
  }

  @Post("/sign-s3-get-url")
  public async signS3GetUrl(
    @Request() request: JawnAuthenticatedRequest,
    @Body()
    body: {
      promptId: string;
      versionId: string;
    },
  ): Promise<
    Result<
      {
        url: string;
      },
      string
    >
  > {
    const controlPlaneManager = new ControlPlaneManager(request.authParams);
    const { promptId, versionId } = body;

    let signedUrl = await controlPlaneManager.signS3GetUrlForPrompt(
      promptId,
      versionId,
      request.authParams,
    );

    if (signedUrl.error) {
      this.setStatus(500);
      return err(signedUrl.error);
    } else {
      return ok({
        url: signedUrl.data!,
      });
    }
  }
}
