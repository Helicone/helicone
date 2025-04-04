import express from "express";
import { AuthParams } from "../packages/common/auth/types";

export type JawnAuthenticatedRequest = express.Request & {
  authParams: AuthParams;
};
