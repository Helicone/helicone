import express from "express";
import { AuthParams } from "../lib/db/supabase";

export type JawnAuthenticatedRequest = express.Request & {
  authParams: AuthParams;
};
