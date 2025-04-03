import express from "express";
import { AuthParams } from "../lib/shared/auth/HeliconeAuthClient";

export type JawnAuthenticatedRequest = express.Request & {
  authParams: AuthParams;
};
