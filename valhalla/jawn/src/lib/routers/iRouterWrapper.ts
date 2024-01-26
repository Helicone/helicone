import { Response as ExpressResponse } from "express";
import { Database } from "../db/database.types";
import { AuthParams, SupabaseConnector } from "../db/supabase";
import { RequestWrapper } from "../requestWrapper";

export interface IRouterWrapper<T> {
  request: RequestWrapper<T>;
  res: ExpressResponse;
}

export interface IRouterWrapperAuth<T> extends IRouterWrapper<T> {
  supabaseClient: SupabaseConnector;
  authParams: AuthParams;
  org?: Database["public"]["Tables"]["organization"]["Row"];
}
