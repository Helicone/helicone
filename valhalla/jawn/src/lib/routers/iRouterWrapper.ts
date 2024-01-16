import { User } from "@supabase/supabase-js";
import { IValhallaDB } from "../db/valhalla";
import {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from "express";
import { AuthParams, SupabaseConnector } from "../db/supabase";
import { RequestWrapper } from "../requestWrapper";
import { Database } from "../db/database.types";

export interface IRouterWrapper<T> {
  request: RequestWrapper<T>;
  res: ExpressResponse;
}

export interface IRouterWrapperDB<T> extends IRouterWrapper<T> {
  db: IValhallaDB;
}

export interface IRouterWrapperAuth<T> extends IRouterWrapperDB<T> {
  supabaseClient: SupabaseConnector;
  authParams: AuthParams;
  org?: Database["public"]["Tables"]["organization"]["Row"];
}
