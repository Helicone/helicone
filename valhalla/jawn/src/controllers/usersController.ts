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
import { JawnAuthenticatedRequest } from "../types/request";

@Route("v1/users")
@Tags("User")
@Security("api_key")
export class UsersController extends Controller {
  @Get("{userId}")
  public async getUser(
    @Path() userId: number,
    @Request() request: JawnAuthenticatedRequest,
    @Query() name?: string
  ): Promise<User> {
    console.log("request", request.authParams);
    return new UsersService().get(userId, name);
  }

  @SuccessResponse("201", "Created") // Custom success response
  @Post()
  public async createUser(
    @Body() requestBody: any,
    @Request() request: JawnAuthenticatedRequest
  ): Promise<void> {
    this.setStatus(201); // set return status 201
    console.log("request", request.authParams);
    new UsersService().create(requestBody);
    return;
  }
}
