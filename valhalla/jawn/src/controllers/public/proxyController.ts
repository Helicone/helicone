import express, { Request, Response } from "express";
import { RequestWrapper } from "../../lib/requestWrapper/requestWrapper";

export const proxyRouter = express.Router();
export interface ProxyRequestBody {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string;
}

proxyRouter.use(express.json());

proxyRouter.post("/v1/proxy", async (req: Request, res: Response) => {
  const requestWrapper = await RequestWrapper.create(req);
  if (requestWrapper.error || !requestWrapper.data) {
    return handleError(requestWrapper.error);
  }

  res.status(200).json({ message: "ok" });
});
