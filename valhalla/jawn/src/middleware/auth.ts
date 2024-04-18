import { NextFunction, Request, Response } from "express";
import { RequestWrapper } from "../lib/requestWrapper";
import { supabaseServer } from "../lib/routers/withAuth";

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const request = new RequestWrapper(req);
    const authorization = request.authHeader();
    if (authorization.error) {
      res.status(401).json({
        error: authorization.error,
      });
      return;
    }
    const authParams = await supabaseServer.authenticate(authorization.data!);
    if (authParams.error || !authParams.data?.organizationId) {
      console.log("authParams.error", authParams.error);
      res.status(401).json({
        error: authParams.error,
        trace: "isAuthenticated.error",
      });
      return;
    }

    (req as any).authParams = authParams.data;
    next();
  } catch (error) {
    res.status(400).send("Invalid token.");
  }
};
