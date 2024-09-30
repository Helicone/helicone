import { Controller, Request, Route, Post, Tags, Security, Body } from "tsoa";
import express from "express";
import { supabaseServer } from "../../lib/db/supabase";
import { err } from "../../lib/shared/result";

@Route("v1/public/waitlist")
@Tags("Waitlist")
export class WaitlistController extends Controller {
  @Post("experiments")
  public async addToWaitlist(
    @Request() request: express.Request,
    @Body() reqBody: { email: string }
  ) {
    if (!reqBody.email) {
      this.setStatus(400);
      return err("Email is required");
    }

    try {
      const { data, error } = await supabaseServer.client
        .from("experiments_waitlist")
        .insert({
          email: reqBody.email,
        });

      if (error) {
        console.error(`Error adding to waitlist: ${error.message}`);
        this.setStatus(500);
        return err(error.message);
      }

      this.setStatus(200);
    } catch (error: any) {
      console.error(`Error adding to waitlist: ${error.message}`);
      this.setStatus(500);
      return err(error.message);
    }
    return;
  }
}
