// src/users/usersController.ts
import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  Route,
  Security,
  Tags,
} from "tsoa";
import { hashAuth } from "../../lib/db/hash";
import { supabaseServer } from "../../lib/routers/withAuth";
import { JawnAuthenticatedRequest } from "../../types/request";

@Route("v1/settings")
@Tags("Settings")
@Security("api_key")
export class SettingController extends Controller {
  @Get("/")
  public async generateHash(
    @Request() request: JawnAuthenticatedRequest
  ): Promise<{
    success?: boolean;
    error?: {
      message?: string;
      details?: string;
    };
  }> {
    return {
      success: true,
    };
  }
}
