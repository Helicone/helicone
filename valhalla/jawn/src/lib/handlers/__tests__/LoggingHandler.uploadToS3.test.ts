import { describe, expect, test, jest } from "@jest/globals";
import { LoggingHandler } from "../LoggingHandler";
import { err, ok } from "../../../packages/common/result";
import { S3Client } from "../../shared/db/s3Client";
import { LogStore } from "../../stores/LogStore";
import { VersionedRequestStore } from "../../stores/request/VersionedRequestStore";

function makeHandler(storeImpl: S3Client["store"]) {
  const s3Client = {
    getRequestResponseKey: (requestId: string, organizationId: string) =>
      `orgs/${organizationId}/requests/${requestId}/request_response_body`,
    store: storeImpl,
  } as unknown as S3Client;

  return new LoggingHandler(
    {} as LogStore,
    {} as VersionedRequestStore,
    s3Client
  );
}

describe("LoggingHandler.uploadToS3", () => {
  test("returns ok when all uploads succeed", async () => {
    const handler = makeHandler(async () => ok("stored"));
    (handler as any).batchPayload.s3Records = [
      {
        requestId: "req-1",
        organizationId: "org-1",
        requestBody: "{}",
        responseBody: "{}",
        location: "s3",
      },
    ];

    const result = await handler.uploadToS3();
    expect(result.error).toBeNull();
    expect(result.data).toBe("All S3 uploads successful");
  });

  test("returns the first upload error instead of silently succeeding", async () => {
    const store = jest
      .fn<S3Client["store"]>()
      .mockResolvedValueOnce(ok("stored"))
      .mockResolvedValueOnce(err("AccessDenied"));

    const handler = makeHandler(store);
    (handler as any).batchPayload.s3Records = [
      {
        requestId: "req-ok",
        organizationId: "org-1",
        requestBody: "{}",
        responseBody: "{}",
        location: "s3",
      },
      {
        requestId: "req-fail",
        organizationId: "org-1",
        requestBody: "{}",
        responseBody: "{}",
        location: "s3",
      },
    ];

    const result = await handler.uploadToS3();
    expect(result.data).toBeNull();
    expect(result.error).toContain("req-fail");
    expect(result.error).toContain("AccessDenied");
  });

  test("skips clickhouse-located records without calling store", async () => {
    const store = jest.fn<S3Client["store"]>();
    const handler = makeHandler(store);
    (handler as any).batchPayload.s3Records = [
      {
        requestId: "req-ch",
        organizationId: "org-1",
        requestBody: "{}",
        responseBody: "{}",
        location: "clickhouse",
      },
    ];

    const result = await handler.uploadToS3();
    expect(result.error).toBeNull();
    expect(store).not.toHaveBeenCalled();
  });
});
