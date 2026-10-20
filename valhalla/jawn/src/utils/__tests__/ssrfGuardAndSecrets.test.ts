import { afterEach, describe, expect, test } from "@jest/globals";
import {
  checkExternalUrlSyntax,
  isBlockedIpAddress,
  validateExternalUrl,
} from "../ssrfGuard";
import { matchesManualAccessKey, secretsMatch } from "../manualAccessKey";

describe("ssrfGuard", () => {
  test("blocks private, loopback, link-local and metadata addresses", () => {
    for (const ip of [
      "127.0.0.1",
      "10.1.2.3",
      "172.16.0.1",
      "172.31.255.255",
      "192.168.1.1",
      "169.254.169.254",
      "100.64.0.1",
      "0.0.0.0",
      "::1",
      "::",
      "fe80::1",
      "fd00::1",
      "fd00:ec2::254",
      "::ffff:127.0.0.1",
      "::ffff:7f00:1",
      "::ffff:a9fe:a9fe",
    ]) {
      expect([ip, isBlockedIpAddress(ip)]).toEqual([ip, true]);
    }
  });

  test("allows public addresses", () => {
    for (const ip of ["8.8.8.8", "1.1.1.1", "172.32.0.1", "2606:4700::1111"]) {
      expect([ip, isBlockedIpAddress(ip)]).toEqual([ip, false]);
    }
  });

  test("rejects blocked hosts and URL tricks without DNS", () => {
    for (const url of [
      "http://localhost:9000",
      "http://127.0.0.1",
      "http://2130706433/",
      "http://0x7f.1/",
      "http://[::1]/",
      "http://169.254.169.254/latest/meta-data",
      "http://metadata.google.internal/computeMetadata/v1",
      "http://service.internal",
      "http://user:pass@example.com",
      "file:///etc/passwd",
      "gopher://example.com",
      "not a url",
    ]) {
      expect([url, checkExternalUrlSyntax(url).error === null]).toEqual([
        url,
        false,
      ]);
    }
    expect(checkExternalUrlSyntax("https://us.i.posthog.com").error).toBeNull();
  });

  test("rejects names that resolve to internal addresses", async () => {
    const resolver = async (host: string) =>
      host === "evil.example.com"
        ? [
            { address: "93.184.216.34", family: 4 },
            { address: "10.0.0.5", family: 4 },
          ]
        : [{ address: "93.184.216.34", family: 4 }];
    expect(
      (await validateExternalUrl("https://evil.example.com", resolver)).error
    ).not.toBeNull();
    expect(
      (await validateExternalUrl("https://api.lytix.co", resolver)).error
    ).toBeNull();
    const failing = async () => {
      throw new Error("NXDOMAIN");
    };
    expect(
      (await validateExternalUrl("https://nope.example.com", failing)).error
    ).not.toBeNull();
  });
});

describe("manual access key", () => {
  const original = process.env.HELICONE_MANUAL_ACCESS_KEY;
  afterEach(() => {
    process.env.HELICONE_MANUAL_ACCESS_KEY = original;
  });

  test("fails closed when the server key is unset or empty", () => {
    delete process.env.HELICONE_MANUAL_ACCESS_KEY;
    expect(matchesManualAccessKey(undefined)).toBe(false);
    expect(matchesManualAccessKey("")).toBe(false);
    expect(matchesManualAccessKey("anything")).toBe(false);
    process.env.HELICONE_MANUAL_ACCESS_KEY = "";
    expect(matchesManualAccessKey("")).toBe(false);
  });

  test("matches only the exact configured key", () => {
    process.env.HELICONE_MANUAL_ACCESS_KEY = "sk-secret-value";
    expect(matchesManualAccessKey("sk-secret-value")).toBe(true);
    expect(matchesManualAccessKey("sk-secret-valu")).toBe(false);
    expect(matchesManualAccessKey("Bearer sk-secret-value")).toBe(false);
    expect(matchesManualAccessKey(undefined)).toBe(false);
  });

  test("secretsMatch requires both sides", () => {
    expect(secretsMatch("a", "a")).toBe(true);
    expect(secretsMatch("a", undefined)).toBe(false);
    expect(secretsMatch(null, "a")).toBe(false);
  });
});
