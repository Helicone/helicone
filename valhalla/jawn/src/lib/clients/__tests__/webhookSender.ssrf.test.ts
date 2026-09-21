import { describe, expect, test } from "@jest/globals";
import {
  isPrivateOrReservedHostname,
  validateWebhookDestination,
} from "../webhookSender";

/**
 * SSRF regression tests for webhook destination validation.
 *
 * These cover obfuscated encodings of private/reserved addresses that bypass a
 * naive dotted-decimal-only check: decimal/octal/hex/dotless IPv4, and IPv6
 * literals (loopback, link-local, ULA, and IPv4-mapped).
 */
describe("isPrivateOrReservedHostname - SSRF normalization bypasses", () => {
  // The hostname values below are what `new URL(...).hostname` yields for the
  // corresponding obfuscated URLs, e.g. https://2130706433/ -> "127.0.0.1",
  // https://[::ffff:127.0.0.1]/ -> "[::ffff:7f00:1]".
  const mustBlock: Array<[string, string]> = [
    ["localhost", "localhost"],
    ["dotted loopback", "127.0.0.1"],
    ["decimal loopback (2130706433)", "127.0.0.1"],
    ["dotless short 127.1", "127.0.0.1"],
    ["private 10/8", "10.0.0.1"],
    ["private 172.16/12", "172.16.0.1"],
    ["private 172.31/12", "172.31.255.1"],
    ["private 192.168/16", "192.168.1.1"],
    ["link-local metadata", "169.254.169.254"],
    ["unspecified 0.0.0.0", "0.0.0.0"],
    ["cgnat 100.64/10", "100.64.0.1"],
    ["ipv6 loopback", "[::1]"],
    ["ipv6 unspecified", "[::]"],
    ["ipv4-mapped loopback", "[::ffff:7f00:1]"],
    ["ipv4-mapped metadata", "[::ffff:169.254.169.254]"],
    ["ipv4-mapped private", "[::ffff:10.0.0.1]"],
    ["ipv6 link-local", "[fe80::1]"],
    ["ipv6 ULA fc00", "[fc00::1]"],
    ["ipv6 ULA fd00", "[fd00::1]"],
    ["gcp metadata name", "metadata.google.internal"],
    ["internal tld", "foo.internal"],
    ["local tld", "svc.local"],
  ];

  const mustAllow: Array<[string, string]> = [
    ["public domain", "example.com"],
    ["public dns 8.8.8.8", "8.8.8.8"],
    ["public dns 1.1.1.1", "1.1.1.1"],
    ["github ip", "140.82.112.3"],
    ["public ipv6", "[2606:4700:4700::1111]"],
    ["public ipv6 google", "[2001:4860:4860::8888]"],
    ["just-below 172.16", "172.15.0.1"],
    ["just-above 172.31", "172.32.0.1"],
    ["not 192.168", "192.169.0.1"],
    ["not 10/8", "11.0.0.1"],
    ["just-below cgnat", "100.63.0.1"],
    ["just-above cgnat", "100.128.0.1"],
  ];

  test.each(mustBlock)("blocks %s (%s)", (_label, hostname) => {
    expect(isPrivateOrReservedHostname(hostname)).toBe(true);
  });

  test.each(mustAllow)("allows %s (%s)", (_label, hostname) => {
    expect(isPrivateOrReservedHostname(hostname)).toBe(false);
  });
});

describe("validateWebhookDestination - end-to-end via URL parser", () => {
  // These exercise the real call path: raw URL -> new URL().hostname -> check.
  const blockedUrls = [
    "https://127.0.0.1/webhook",
    "https://2130706433/webhook", // decimal 127.0.0.1
    "https://0x7f000001/webhook", // hex 127.0.0.1
    "https://0177.0.0.1/webhook", // octal 127.0.0.1
    "https://127.1/webhook", // dotless 127.0.0.1
    "https://169.254.169.254/latest/meta-data/", // cloud metadata
    "https://[::1]/webhook",
    "https://[::ffff:127.0.0.1]/webhook",
    "https://[fe80::1]/webhook",
    "https://[fc00::1]/webhook",
    "https://192.168.0.1/webhook",
    "https://10.0.0.5/webhook",
  ];

  const allowedUrls = [
    "https://example.com/webhook",
    "https://api.helicone.ai/v1/webhook",
    "https://8.8.8.8/webhook",
    "https://[2606:4700:4700::1111]/webhook",
  ];

  test.each(blockedUrls)("rejects %s", (url) => {
    expect(validateWebhookDestination(url)).toBe(
      "Destination cannot point to private or internal networks"
    );
  });

  test.each(allowedUrls)("accepts %s", (url) => {
    expect(validateWebhookDestination(url)).toBeNull();
  });

  test("rejects non-https", () => {
    expect(validateWebhookDestination("http://example.com/webhook")).toBe(
      "Destination must use HTTPS"
    );
  });
});
