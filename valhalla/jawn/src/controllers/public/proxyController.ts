import express, { Request as ExpressRequest, Response } from "express";
import { RequestWrapper } from "../../lib/requestWrapper/requestWrapper";
import { proxyForwarder } from "../../lib/proxy/ProxyForwarder";
import {
  Body,
  Controller,
  Path,
  Post,
  Route,
  Security,
  Tags,
  Request,
  Res,
} from "tsoa";
import { JawnAuthenticatedRequest } from "../../types/request";
import { ok } from "../../lib/shared/result";

@Route("v1/gateway")
@Tags("Gateway")
@Security("api_key")
export class ProxyController extends Controller {
  ROUTER_MAP: {
    [key: string]: (
      requestWrapper: RequestWrapper,
      res: Response
    ) => Promise<void>;
  } = {
    OAI: this.handleOpenAIProxy,
    GATEWAY: this.handleGatewayAPIRouter,
    ANTHROPIC: this.handleAnthropicProxy,
  };

  async handleAnthropicProxy(requestWrapper: RequestWrapper, res: Response) {
    await proxyForwarder(requestWrapper, "ANTHROPIC", res);
  }

  async handleOpenAIProxy(requestWrapper: RequestWrapper, res: Response) {
    if (requestWrapper.url.pathname.includes("audio")) {
      const new_url = new URL(
        `https://api.openai.com${requestWrapper.url.pathname}`
      );
      await fetch(new_url.href, {
        method: requestWrapper.getMethod(),
        headers: requestWrapper.getHeaders(),
        body: requestWrapper.getBody(),
      });
    }

    await proxyForwarder(requestWrapper, "OPENAI", res);
  }

  async handleGatewayAPIRouter(requestWrapper: RequestWrapper, res: Response) {
    res.status(501).json({ message: "Not implemented" });
  }

  @Post("/{provider}/*")
  public async proxyRequest(
    @Request() request: JawnAuthenticatedRequest,
    @Path() provider: string,
    @Res() response: Response
  ): Promise<void> {
    const { data: requestWrapper, error: requestWrapperErr } =
      await RequestWrapper.create(request);

    if (requestWrapperErr || !requestWrapper) {
      this.setStatus(500);
      response.status(500).send("Error creating request wrapper");
      return;
    }

    const routerFunction = this.ROUTER_MAP[provider.toUpperCase()];

    if (routerFunction) {
      await routerFunction(requestWrapper, response);
      ok("");
    } else {
      this.setStatus(400);
      response.status(400).send("Invalid provider");
      return;
    }
  }

  @Post("/v1/gateway/*")
  public async gatewayRequest(
    @Request() request: JawnAuthenticatedRequest,
    @Res() response: Response
  ): Promise<void> {
    const { data: requestWrapper, error: requestWrapperErr } =
      await RequestWrapper.create(request);

    if (requestWrapperErr || !requestWrapper) {
      this.setStatus(500);
      response.status(500).send("Error creating request wrapper");
      return;
    }

    const routerFunction = this.ROUTER_MAP["GATEWAY"];

    if (routerFunction) {
      await routerFunction(requestWrapper, response);
      ok("");
    } else {
      this.setStatus(400);
      response.status(400).send("Invalid provider");
      return;
    }
  }
}
