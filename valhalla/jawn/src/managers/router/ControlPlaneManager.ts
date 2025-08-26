import { S3Client } from "../../lib/shared/db/s3Client";
import { Result } from "../../packages/common/result";
import { BaseManager } from "../BaseManager";
import { AuthParams } from "../../packages/common/auth/types";

export class ControlPlaneManager extends BaseManager {
  private s3Client: S3Client;
  constructor(authParams: AuthParams) {
    super(authParams);

    this.s3Client = new S3Client(
      process.env.S3_ACCESS_KEY || undefined,
      process.env.S3_SECRET_KEY || undefined,
      process.env.S3_ENDPOINT ?? "",
      process.env.S3_BUCKET_NAME ?? "",
      (process.env.S3_REGION as "us-west-2" | "eu-west-1") ?? "us-west-2"
    );
  }

  async signS3Url(
    requestId: string,
    payloadSize: number,
    authParams: AuthParams
  ): Promise<Result<string, string>> {
    const key = this.s3Client.getRawRequestResponseKey(
      requestId,
      authParams.organizationId
    );
    // 10 minutes
    const expiresIn = 60 * 10;
    return await this.s3Client.putObjectSignedUrlWithExpiration(
      key,
      payloadSize,
      expiresIn
    );
  }

  async signS3GetUrlForPrompt(
    promptId: string,
    versionId: string,
    authParams: AuthParams
  ): Promise<Result<string, string>> {
    const key = this.s3Client.getPromptKey(
      promptId,
      versionId,
      authParams.organizationId
    );
    return await this.s3Client.getSignedUrl(key);
  }
}
