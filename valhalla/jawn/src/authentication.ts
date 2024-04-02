// This file is only used for tsoa generated code
// We use express middleware for authentication, because we can have more control and flexibility

import * as express from "express";

export async function expressAuthentication(
  req: express.Request,
  securityName: string,
  scopes?: string[]
): Promise<any> {
  return null;
}
