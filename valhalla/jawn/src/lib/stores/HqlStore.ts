import { createArrayCsvWriter } from "csv-writer";
import { err, ok, Result } from "../../packages/common/result";
import { S3Client } from "../shared/db/s3Client";
import fs from "fs";

const HQL_STORE_BUCKET = "hql-store";

export class HqlStore {
  private s3Client: S3Client;

  constructor() {
    this.s3Client = new S3Client(
      process.env.S3_ACCESS_KEY || undefined,
      process.env.S3_SECRET_KEY || undefined,
      process.env.S3_ENDPOINT ?? "",
      HQL_STORE_BUCKET,
      (process.env.S3_REGION as "us-west-2" | "eu-west-1") ?? "us-west-2"
    );
  }

  async uploadCsv(
    fileName: string,
    organizationId: string,
    rows: Record<string, any>[]
  ): Promise<Result<string, string>> {
    // if result is ok, if over 100k store in s3 and return url
    const key = `${organizationId}/${fileName}`;
    const csvWriter = createArrayCsvWriter({
      path: fileName,
      header: Object.keys(rows[0]),
    });

    await csvWriter.writeRecords(rows.map((row) => Object.values(row)));
    const csvBuffer = fs.readFileSync(fileName);
    const uploadResult = await this.s3Client.uploadToS3(
      key,
      csvBuffer,
      "text/csv"
    );

    if (uploadResult.error) {
      fs.unlinkSync(fileName);
      return err(uploadResult.error);
    }

    const result = await this.s3Client.getSignedUrl(key);

    if (result.error || !result.data) {
      fs.unlinkSync(fileName);
      return err(result.error ?? "Failed to get signed url");
    }

    fs.unlinkSync(fileName);
    return ok(result.data);
  }
}
