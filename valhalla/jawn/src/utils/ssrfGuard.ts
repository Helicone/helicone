import { lookup } from "dns/promises";
import net from "net";
import { err, ok, Result } from "../packages/common/result";

/**
 * Guards outbound requests to caller-supplied hosts (e.g. the PostHog and
 * Lytix hosts a customer can set on a request) against reaching internal
 * services: loopback, private and link-local ranges, and cloud metadata
 * endpoints.
 */

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "metadata",
  "metadata.google.internal",
  "instance-data",
  "instance-data.ec2.internal",
]);

const BLOCKED_HOSTNAME_SUFFIXES = [
  ".localhost",
  ".internal",
  ".local",
  ".localdomain",
];

function ipv4ToInt(ip: string): number {
  return ip
    .split(".")
    .reduce((acc, octet) => (acc << 8) + (parseInt(octet, 10) & 255), 0) >>> 0;
}

const BLOCKED_IPV4_CIDRS: Array<[string, number]> = [
  ["0.0.0.0", 8], // "this" network
  ["10.0.0.0", 8], // private
  ["100.64.0.0", 10], // carrier-grade NAT
  ["127.0.0.0", 8], // loopback
  ["169.254.0.0", 16], // link-local, incl. 169.254.169.254 metadata
  ["172.16.0.0", 12], // private
  ["192.0.0.0", 24], // IETF protocol assignments
  ["192.0.2.0", 24], // TEST-NET-1
  ["192.88.99.0", 24], // 6to4 relay
  ["192.168.0.0", 16], // private
  ["198.18.0.0", 15], // benchmarking
  ["198.51.100.0", 24], // TEST-NET-2
  ["203.0.113.0", 24], // TEST-NET-3
  ["224.0.0.0", 4], // multicast
  ["240.0.0.0", 4], // reserved, incl. broadcast
];

function isBlockedIpv4(ip: string): boolean {
  const value = ipv4ToInt(ip);
  return BLOCKED_IPV4_CIDRS.some(([base, bits]) => {
    const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
    return (value & mask) === (ipv4ToInt(base) & mask);
  });
}

function isBlockedIpv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (lower === "::" || lower === "::1") return true;
  // IPv4-mapped / IPv4-compatible / NAT64 forms embedding an IPv4 address.
  const embedded = lower.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
  if (embedded && net.isIPv4(embedded[1])) {
    return isBlockedIpv4(embedded[1]);
  }
  const mapped = lower.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (mapped) {
    const hi = parseInt(mapped[1], 16);
    const lo = parseInt(mapped[2], 16);
    return isBlockedIpv4(
      `${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`
    );
  }
  const firstHextet = parseInt(lower.split(":")[0] || "0", 16);
  if ((firstHextet & 0xfe00) === 0xfc00) return true; // fc00::/7 unique local
  if ((firstHextet & 0xffc0) === 0xfe80) return true; // fe80::/10 link-local
  if ((firstHextet & 0xffc0) === 0xfec0) return true; // fec0::/10 site-local
  if ((firstHextet & 0xff00) === 0xff00) return true; // ff00::/8 multicast
  if (lower.startsWith("fd00:ec2::")) return true; // AWS IMDS over IPv6
  return false;
}

export function isBlockedIpAddress(ip: string): boolean {
  if (net.isIPv4(ip)) return isBlockedIpv4(ip);
  if (net.isIPv6(ip)) return isBlockedIpv6(ip);
  // Not a recognizable address: treat as blocked.
  return true;
}

function stripBrackets(hostname: string): string {
  return hostname.startsWith("[") && hostname.endsWith("]")
    ? hostname.slice(1, -1)
    : hostname;
}

/**
 * Synchronous checks that need no DNS: scheme, credentials, blocked names and
 * literal IP addresses.
 */
export function checkExternalUrlSyntax(rawUrl: string): Result<URL, string> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return err("Invalid URL");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return err("Only http(s) URLs are allowed");
  }
  if (url.username || url.password) {
    return err("URLs with credentials are not allowed");
  }
  const hostname = stripBrackets(url.hostname.toLowerCase()).replace(
    /\.$/,
    ""
  );
  if (!hostname) {
    return err("Invalid host");
  }
  if (
    BLOCKED_HOSTNAMES.has(hostname) ||
    BLOCKED_HOSTNAME_SUFFIXES.some((suffix) => hostname.endsWith(suffix))
  ) {
    return err("Host is not allowed");
  }
  if (net.isIP(hostname) && isBlockedIpAddress(hostname)) {
    return err("Host is not allowed");
  }
  // Numeric forms that are not dotted quads (e.g. "2130706433", "0x7f.1")
  // are interpreted as IPs by some resolvers.
  if (/^[0-9.]+$/.test(hostname) || /^0x[0-9a-f.]+$/i.test(hostname)) {
    if (!net.isIPv4(hostname)) {
      return err("Host is not allowed");
    }
  }
  return ok(url);
}

type Resolver = (
  hostname: string
) => Promise<Array<{ address: string; family: number }>>;

const defaultResolver: Resolver = (hostname) =>
  lookup(hostname, { all: true, verbatim: true });

const resolutionCache = new Map<
  string,
  { allowed: boolean; expiresAt: number }
>();
const RESOLUTION_CACHE_TTL_MS = 60 * 1000;

/**
 * Full check: syntax plus DNS resolution. Every resolved address must be
 * public. Callers must also disable redirects on the actual request.
 */
export async function validateExternalUrl(
  rawUrl: string,
  resolver: Resolver = defaultResolver
): Promise<Result<URL, string>> {
  const syntax = checkExternalUrlSyntax(rawUrl);
  if (syntax.error !== null) {
    return syntax;
  }
  const url = syntax.data;
  const hostname = stripBrackets(url.hostname.toLowerCase());
  if (net.isIP(hostname)) {
    return ok(url);
  }

  const cached = resolutionCache.get(hostname);
  if (cached && cached.expiresAt > Date.now() && resolver === defaultResolver) {
    return cached.allowed ? ok(url) : err("Host is not allowed");
  }

  let allowed = false;
  try {
    const addresses = await resolver(hostname);
    allowed =
      addresses.length > 0 &&
      addresses.every((a) => !isBlockedIpAddress(a.address));
  } catch {
    allowed = false;
  }
  if (resolver === defaultResolver) {
    resolutionCache.set(hostname, {
      allowed,
      expiresAt: Date.now() + RESOLUTION_CACHE_TTL_MS,
    });
  }
  return allowed ? ok(url) : err("Host is not allowed");
}
