import { User } from "@supabase/supabase-js";
import { IValhallaDB } from "../db/valhalla";
import {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from "express";
import { SupabaseConnector } from "../db/supabase";

export interface IRouterWrapper {
  req: ExpressRequest;
  res: ExpressResponse;
}

export interface IRouterWrapperDB extends IRouterWrapper {
  db: IValhallaDB;
}

export interface IRouterWrapperAuth extends IRouterWrapperDB {
  supabaseClient: SupabaseConnector;
}
