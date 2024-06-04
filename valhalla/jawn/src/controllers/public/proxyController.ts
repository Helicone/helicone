import express, { Request, Response } from "express";
import { RequestWrapper } from "../../lib/requestWrapper/requestWrapper";

export const proxyRouter = express.Router();
proxyRouter.use(express.json());

export interface ProxyRequestBody {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string;
}

const handleAnthropicProxy = (
  requestWrapper: RequestWrapper,
  res: Response
) => {
  // Handle Anthropic Proxy
  res.status(200).json({ message: "Anthropic Proxy" });
};

const handleOpenAIProxy = async (
  requestWrapper: RequestWrapper,
  res: Response
) => {
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
  res.status(200).json({ message: "OpenAI Proxy" });
};

const handleGatewayAPIRouter = (
  requestWrapper: RequestWrapper,
  res: Response
) => {
  // Handle Gateway API Router
  res.status(200).json({ message: "Gateway API Router" });
};

const ROUTER_MAP: {
  [key: string]: (requestWrapper: RequestWrapper, res: Response) => void;
} = {
  OAI: handleOpenAIProxy,
  GATEWAY: handleGatewayAPIRouter,
  ANTHROPIC: handleAnthropicProxy,
};

proxyRouter.post("/v1/proxy/:provider", async (req: Request, res: Response) => {
  const { provider } = req.params;

  const { data: requestWrapper, error: requestWrapperErr } =
    await RequestWrapper.create(req);
  if (requestWrapperErr || !requestWrapper) {
    return res.status(500).json({ message: "Error creating request wrapper" });
  }

  const routerFunction = ROUTER_MAP[provider.toUpperCase()];

  if (routerFunction) {
    routerFunction(
      { data: requestWrapper, error: requestWrapperErr }.data,
      res
    );
  } else {
    res.status(400).json({ message: "Invalid provider" });
  }
});
