// src/users/usersController.ts
import {
  Body,
  Controller,
  Get,
  Path,
  Post,
  Query,
  Route,
  Security,
  Request,
  SuccessResponse,
  Tags,
} from "tsoa";
import { User } from "../models/user";
import express from "express";
import { UsersService, UserCreationParams } from "../services/usersService";

@Route("users")
@Tags("User")
export class UsersController extends Controller {
  @Get("{userId}")
  public async getUser(
    @Path() userId: number,
    @Request() request: express.Request & { user: { id: number } },
    @Query() name?: string
  ): Promise<User> {
    console.log("request", request.user);
    return new UsersService().get(userId, name);
  }

  @SuccessResponse("201", "Created") // Custom success response
  @Post()
  public async createUser(
    @Body() requestBody: UserCreationParams
  ): Promise<void> {
    this.setStatus(201); // set return status 201
    new UsersService().create(requestBody);
    return;
  }
}
