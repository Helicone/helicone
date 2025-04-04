import { Controller, Request, Route, Post, Tags, Security, Body } from "tsoa";
import express from "express";
import { err, ok } from "../../packages/common/result";
import { dbExecute } from "../../lib/shared/db/dbExecute";

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
      const { error } = await dbExecute(
        `INSERT INTO experiments_waitlist (email) VALUES ($1)`,
        [reqBody.email]
      );

      if (error) {
        console.error(`Error adding to waitlist: ${error}`);
        this.setStatus(500);
        return err(error);
      }

      this.setStatus(200);
      return ok("Added to waitlist");
    } catch (error: any) {
      console.error(`Error adding to waitlist: ${error.message}`);
      this.setStatus(500);
      return err(error.message);
    }
    return;
  }
}
