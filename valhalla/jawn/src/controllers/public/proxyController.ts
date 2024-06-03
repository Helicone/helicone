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

proxyRouter.post("/v1/proxy", async (req: Request, res: Response) => {
  const requestWrapper = await RequestWrapper.create(req);
  if (requestWrapper.error || !requestWrapper.data) {
    return res.status(500).json({ message: "error" });
  }

  res.status(200).json({ message: "ok" });
});
