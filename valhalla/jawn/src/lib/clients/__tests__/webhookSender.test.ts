import { describe, expect, it } from "@jest/globals";
import {
  TEST_WEBHOOK_FAILED_MESSAGE,
  classifyWebhookStatus,
  deliverWebhook,
  isBlockedIpAddress,
  normalizeWebhookHostname,
  resolveWebhookDestination,
  sendTestWebhook,
  validateWebhookDestination,
} from "../webhookSender";

const lookupReturning =
  (...addresses: Array<{ address: string; family: number }>) =>
  async () =>
    addresses;

const failingLookup = async () => {
  throw new Error("ENOTFOUND");
};

describe("isBlockedIpAddress", () => {
  it.each([
    "0.0.0.0",
    "10.1.2.3",
    "100.64.0.1", // CGNAT
    "100.127.255.255",
    "127.0.0.1",
    "127.255.255.254",
    "169.254.169.254", // cloud metadata
    "172.16.0.1",
    "172.31.255.255",
    "192.0.0.1",
    "192.0.2.10",
    "192.168.1.1",
    "198.18.0.1",
    "224.0.0.1",
    "255.255.255.255",
    "::",
    "::1",
    "[::1]",
    "::ffff:127.0.0.1", // IPv4-mapped loopback
    "::ffff:7f00:1", // same, hex form
    "::ffff:169.254.169.254",
    "::ffff:a9fe:a9fe",
    "::127.0.0.1", // IPv4-compatible
    "64:ff9b::a9fe:a9fe", // NAT64 to metadata
    "2002:7f00:1::", // 6to4 of 127.0.0.1
    "2001::1", // Teredo
    "2001:db8::1",
    "fc00::1", // ULA
    "fd00:ec2::254", // AWS IMDS IPv6
    "fe80::1", // link-local
    "fe80::1%eth0",
    "ff02::1", // multicast
    "not-an-ip",
  ])("blocks %s", (ip) => {
    expect(isBlockedIpAddress(ip)).toBe(true);
  });

  it.each([
    "1.1.1.1",
    "8.8.8.8",
    "100.63.255.255",
    "100.128.0.1",
    "172.15.0.1",
    "172.32.0.1",
    "192.169.0.1",
    "2606:4700:4700::1111",
    "::ffff:8.8.8.8",
    "64:ff9b::808:808",
  ])("allows public address %s", (ip) => {
    expect(isBlockedIpAddress(ip)).toBe(false);
  });
});

describe("normalizeWebhookHostname", () => {
  it("lowercases, strips brackets and trailing dots", () => {
    expect(normalizeWebhookHostname("Example.COM.")).toBe("example.com");
    expect(normalizeWebhookHostname("localhost..")).toBe("localhost");
    expect(normalizeWebhookHostname("[::1]")).toBe("::1");
  });
});

describe("validateWebhookDestination", () => {
  it("accepts a public https URL", () => {
    expect(validateWebhookDestination("https://example.com/hook")).toBeNull();
  });

  it.each([
    ["http://example.com/hook", "Destination must use HTTPS"],
    ["ftp://example.com/hook", "Destination must use HTTPS"],
    ["not a url", "Invalid destination URL format"],
    ["", "Invalid destination URL"],
    [
      "https://user:pass@example.com/hook",
      "Destination must not contain credentials",
    ],
  ])("rejects %s", (destination, message) => {
    expect(validateWebhookDestination(destination)).toBe(message);
  });

  it.each([
    "https://localhost/hook",
    "https://localhost./hook", // trailing dot
    "https://LOCALHOST../hook",
    "https://foo.localhost/hook",
    "https://127.0.0.1/hook",
    "https://2130706433/hook", // decimal 127.0.0.1
    "https://0x7f000001/hook", // hex 127.0.0.1
    "https://0177.0.0.1/hook", // octal 127.0.0.1
    "https://[::1]/hook",
    "https://[::ffff:127.0.0.1]/hook",
    "https://[::ffff:a9fe:a9fe]/latest/meta-data",
    "https://169.254.169.254/latest/meta-data",
    "https://metadata.google.internal/computeMetadata/v1/",
    "https://metadata.google.internal./computeMetadata/v1/",
    "https://kubernetes.default.svc.cluster.local/",
    "https://intranet/", // single-label name
    "https://10.0.0.5:8443/hook",
  ])("rejects internal destination %s", (destination) => {
    expect(validateWebhookDestination(destination)).toBe(
      "Destination cannot point to private or internal networks"
    );
  });
});

describe("resolveWebhookDestination", () => {
  it("returns the first resolved public address", async () => {
    const result = await resolveWebhookDestination(
      "https://hooks.example.com/x",
      lookupReturning(
        { address: "93.184.216.34", family: 4 },
        { address: "2606:2800:220:1::1", family: 6 }
      )
    );
    expect(result.error).toBeNull();
    expect(result.data?.address).toBe("93.184.216.34");
    expect(result.data?.family).toBe(4);
    expect(result.data?.hostname).toBe("hooks.example.com");
  });

  it("rejects when any resolved address is private (DNS pointing inside)", async () => {
    const result = await resolveWebhookDestination(
      "https://rebind.example.com/x",
      lookupReturning(
        { address: "93.184.216.34", family: 4 },
        { address: "10.0.0.1", family: 4 }
      )
    );
    expect(result.error).toBe(
      "Destination cannot point to private or internal networks"
    );
  });

  it("rejects hostnames resolving to IPv4-mapped metadata addresses", async () => {
    const result = await resolveWebhookDestination(
      "https://evil.example.com/x",
      lookupReturning({ address: "::ffff:169.254.169.254", family: 6 })
    );
    expect(result.error).toBe(
      "Destination cannot point to private or internal networks"
    );
  });

  it("rejects unresolvable hostnames", async () => {
    const result = await resolveWebhookDestination(
      "https://nope.example.com/x",
      failingLookup
    );
    expect(result.error).toBe("Destination hostname could not be resolved");
  });

  it("does not resolve IP literals", async () => {
    const result = await resolveWebhookDestination(
      "https://8.8.8.8/x",
      failingLookup
    );
    expect(result.error).toBeNull();
    expect(result.data?.address).toBe("8.8.8.8");
  });
});

describe("classifyWebhookStatus", () => {
  it("treats only 2xx as delivered and never follows 3xx", () => {
    expect(classifyWebhookStatus(200)).toBe("delivered");
    expect(classifyWebhookStatus(204)).toBe("delivered");
    expect(classifyWebhookStatus(301)).toBe("redirect");
    expect(classifyWebhookStatus(302)).toBe("redirect");
    expect(classifyWebhookStatus(307)).toBe("redirect");
    expect(classifyWebhookStatus(308)).toBe("redirect");
    expect(classifyWebhookStatus(404)).toBe("http_error");
    expect(classifyWebhookStatus(500)).toBe("http_error");
  });
});

describe("deliverWebhook", () => {
  it("does not connect when the destination resolves to a private address", async () => {
    const result = await deliverWebhook(
      "https://internal.example.com/hook",
      "{}",
      {},
      1000,
      lookupReturning({ address: "127.0.0.1", family: 4 })
    );
    expect(result).toEqual({
      delivered: false,
      reason: "invalid_destination",
      detail: "Destination cannot point to private or internal networks",
    });
  });
});

describe("sendTestWebhook", () => {
  it("returns the validation message for internal destinations", async () => {
    const result = await sendTestWebhook({
      id: "1",
      destination: "https://169.254.169.254/latest/meta-data",
      config: {},
      hmac_key: "k",
    });
    expect(result.error).toBe(
      "Destination cannot point to private or internal networks"
    );
  });

  it("exposes the generic failure message constant", () => {
    expect(TEST_WEBHOOK_FAILED_MESSAGE).not.toMatch(/status/i);
  });
});
