import express, { Request, Response } from "express";
import { RequestWrapper } from "../../lib/requestWrapper/requestWrapper";
import { proxyForwarder } from "../../lib/proxy/ProxyForwarder";

export const proxyRouter = express.Router();
proxyRouter.use(express.json());

export interface ProxyRequestBody {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string;
}

const handleAnthropicProxy = async (
  requestWrapper: RequestWrapper,
  res: Response
) => {
  await proxyForwarder(requestWrapper, "ANTHROPIC", res);
};

const handleOpenAIProxy = async (
  requestWrapper: RequestWrapper,
  res: Response
) => {
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
};

const handleGatewayAPIRouter = async (
  requestWrapper: RequestWrapper,
  res: Response
) => {
  res.status(501).json({ message: "Not implemented" });
  // Handle Gateway API Router
  //   res.status(200).json({ message: "Gateway API Router" });
};

const ROUTER_MAP: {
  [key: string]: (
    requestWrapper: RequestWrapper,
    res: Response
  ) => Promise<void>;
} = {
  OAI: handleOpenAIProxy,
  GATEWAY: handleGatewayAPIRouter,
  ANTHROPIC: handleAnthropicProxy,
};

// For specific providers
proxyRouter.post(
  "/v1/gateway/:provider/*",
  async (req: Request, res: Response) => {
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
      await routerFunction(
        { data: requestWrapper, error: requestWrapperErr }.data,
        res
      );
    } else {
      res.status(400).json({ message: "Invalid provider" });
    }
  }
);

// Just for gateway
proxyRouter.post("/v1/gateway/*", async (req: Request, res: Response) => {
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
});
