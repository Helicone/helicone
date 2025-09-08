import { createArrayCsvWriter } from "csv-writer";
import { err, ok, Result } from "../../packages/common/result";
import { S3Client } from "../shared/db/s3Client";
import fs from "fs";

const HQL_STORE_BUCKET = process.env.HQL_STORE_BUCKET || "hql-store";

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
    // Determine column order from keys of first row
    if (rows.length === 0) {
      return err("No data to export");
    }
    const headers = Object.keys(rows[0]);
    const csvWriter = createArrayCsvWriter({
      path: fileName,
      header: headers,
    });

    // Normalize values: stringify objects/arrays to avoid [object Object]
    const records = rows.map((row) =>
      headers.map((key) => {
        const value = row[key];
        if (value === null || value === undefined) {
          return "";
        }
        if (typeof value === "object") {
          try {
            return JSON.stringify(value);
          } catch (_) {
            // Fallback to string coercion if JSON fails
            return String(value);
          }
        }
        return value;
      })
    );

    await csvWriter.writeRecords(records);
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
