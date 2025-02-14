import express, {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from "express";
import { RequestWrapper } from "../../lib/requestWrapper/requestWrapper";
import { proxyForwarder } from "../../lib/proxy/ProxyForwarder";

import { Readable as NodeReadableStream } from "stream";
import fetch, { Response } from "node-fetch";

export const proxyRouter = express.Router();
proxyRouter.use(express.json());

export interface ProxyRequestBody {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string;
}

// For specific providers
proxyRouter.post(
  "/v1/gateway/:provider/*",
  async (req: ExpressRequest, res: ExpressResponse) => {
    const { provider } = req.params;

    const { data: requestWrapper, error: requestWrapperErr } =
      await RequestWrapper.create(req);
    if (requestWrapperErr || !requestWrapper) {
      return res
        .status(500)
        .json({ message: "Error creating request wrapper" });
    }

    const routerFunction = ROUTER_MAP[provider.toUpperCase()];

    if (routerFunction) {
      const response: Response = await routerFunction(
        { data: requestWrapper, error: requestWrapperErr }.data
      );

      res.status(response.status);

      response.headers.forEach((value, key) => {
        res.setHeader(key, value);
      });

      // TODO we need to pipe the response body to res. but the response body is a ReadableStream or a Buffer or a string
      const responseBody = response.body;

      if (responseBody instanceof NodeReadableStream) {
        // Pipe ReadableStream to the response
        responseBody.pipe(res);
      } else if (Buffer.isBuffer(responseBody)) {
        // Write Buffer to the response
        res.end(responseBody);
      } else if (typeof responseBody === "string") {
        // Write string to the response
        res.end(responseBody);
      } else {
        try {
          const text = await response.text();
          if (text) {
            res.end(text);
          } else {
            res.status(500).json({ message: "Unsupported response body type" });
          }
        } catch (e) {
          res.status(500).json({ message: "Unsupported response body type" });
        }
      }
    } else {
      res.status(400).json({ message: "Invalid provider" });
    }
  }
);

// Just for gateway
proxyRouter.post(
  "/v1/gateway/*",
  async (req: ExpressRequest, res: ExpressResponse) => {
    throw new Error("Not implemented");
    //   const { data: requestWrapper, error: requestWrapperErr } =
    //     await RequestWrapper.create(req);
    //   if (requestWrapperErr || !requestWrapper) {
    //     return res.status(500).json({ message: "Error creating request wrapper" });
    //   }

    //   const routerFunction = ROUTER_MAP["GATEWAY"];

    //   if (routerFunction) {
    //     routerFunction(
    //       { data: requestWrapper, error: requestWrapperErr }.data,
    //       res
    //     );
    //   } else {
    //     res.status(400).json({ message: "Invalid provider" });
    //   }
  }
);

const handleAnthropicProxy = async (requestWrapper: RequestWrapper) => {
  return await proxyForwarder(requestWrapper, "ANTHROPIC");
};

const handleOpenAIProxy = async (requestWrapper: RequestWrapper) => {
  if (requestWrapper.url.pathname.includes("audio")) {
    const new_url = new URL(
      `https://api.openai.com${requestWrapper.url.pathname}`
    );
    return await fetch(new_url.href, {
      method: requestWrapper.getMethod(),
      headers: requestWrapper.getHeaders(),
      body: requestWrapper.getBody(),
    });
  }

  return await proxyForwarder(requestWrapper, "OPENAI");
};

const handleGatewayAPIRouter = async (requestWrapper: RequestWrapper) => {
  return new Response("Not implemented", { status: 501 });
};

const ROUTER_MAP: {
  [key: string]: (requestWrapper: RequestWrapper) => Promise<Response>;
} = {
  OAI: handleOpenAIProxy,
  GATEWAY: handleGatewayAPIRouter,
  ANTHROPIC: handleAnthropicProxy,
};
