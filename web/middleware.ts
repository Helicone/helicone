import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// European country codes (ISO 3166-1 alpha-2)
// EU member states and associated countries
const EU_COUNTRY_CODES = new Set([
  // EU Member States
  "AT", // Austria
  "BE", // Belgium
  "BG", // Bulgaria
  "HR", // Croatia
  "CY", // Cyprus
  "CZ", // Czech Republic
  "DK", // Denmark
  "EE", // Estonia
  "FI", // Finland
  "FR", // France
  "DE", // Germany
  "GR", // Greece
  "HU", // Hungary
  "IE", // Ireland
  "IT", // Italy
  "LV", // Latvia
  "LT", // Lithuania
  "LU", // Luxembourg
  "MT", // Malta
  "NL", // Netherlands
  "PL", // Poland
  "PT", // Portugal
  "RO", // Romania
  "SK", // Slovakia
  "SI", // Slovenia
  "ES", // Spain
  "SE", // Sweden
  // European Economic Area (EEA)
  "IS", // Iceland
  "LI", // Liechtenstein
  "NO", // Norway
  // Other European countries that might prefer EU region
  "CH", // Switzerland
  "GB", // United Kingdom
  "AL", // Albania
  "AD", // Andorra
  "BA", // Bosnia and Herzegovina
  "MC", // Monaco
  "ME", // Montenegro
  "MK", // North Macedonia
  "RS", // Serbia
  "SM", // San Marino
  "UA", // Ukraine
  "VA", // Vatican City
  "XK", // Kosovo
]);

// Protected dashboard routes that require authentication
// These should redirect to signin on non-prefixed domains
const PROTECTED_ROUTES = [
  "/alerts",
  "/cache",
  "/credits",
  "/dashboard",
  "/datasets",
  "/evaluators",
  "/experiment",
  "/experiments",
  "/hql",
  "/onboarding",
  "/playground",
  "/prompts",
  "/properties",
  "/providers",
  "/rate-limit",
  "/requests",
  "/sessions",
  "/settings",
  "/users",
  "/vault",
  "/webhooks",
  "/welcome",
];

/**
 * Checks if a given path starts with any of the protected routes
 */
function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

/**
 * Determines if the host is a non-prefixed Helicone domain
 * (i.e., helicone.ai, www.helicone.ai, but NOT us.helicone.ai or eu.helicone.ai)
 */
function isNonPrefixedDomain(host: string): boolean {
  // Skip localhost, Vercel preview, and already-prefixed domains
  if (
    host.includes("localhost") ||
    host.includes("vercel") ||
    host.startsWith("us.") ||
    host.startsWith("eu.")
  ) {
    return false;
  }

  // Check if it's a helicone.ai domain without regional prefix
  return host.includes("helicone.ai");
}

/**
 * Determines the appropriate region based on the user's country code
 */
function getRegionFromCountry(countryCode: string | null): "us" | "eu" {
  if (!countryCode) {
    return "us"; // Default to US if country is unknown
  }

  return EU_COUNTRY_CODES.has(countryCode.toUpperCase()) ? "eu" : "us";
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host") || "";

  // Only process protected routes on non-prefixed domains
  if (!isProtectedRoute(pathname) || !isNonPrefixedDomain(host)) {
    return NextResponse.next();
  }

  // Get country code from Vercel's geolocation header
  const countryCode = request.headers.get("x-vercel-ip-country");

  // Determine the appropriate region
  const region = getRegionFromCountry(countryCode);

  // Build the redirect URL to the regional signin page
  const regionalDomain =
    region === "eu" ? "https://eu.helicone.ai" : "https://us.helicone.ai";

  // Redirect to the signin page on the appropriate regional domain
  // Preserve the original path as a return URL parameter so users can be redirected after signin
  const redirectUrl = new URL("/signin", regionalDomain);
  redirectUrl.searchParams.set("returnTo", pathname);

  return NextResponse.redirect(redirectUrl);
}

export const config = {
  // Match all protected routes at the root level
  matcher: [
    "/alerts/:path*",
    "/cache/:path*",
    "/credits/:path*",
    "/dashboard/:path*",
    "/datasets/:path*",
    "/evaluators/:path*",
    "/experiment/:path*",
    "/experiments/:path*",
    "/hql/:path*",
    "/onboarding/:path*",
    "/playground/:path*",
    "/prompts/:path*",
    "/properties/:path*",
    "/providers/:path*",
    "/rate-limit/:path*",
    "/requests/:path*",
    "/sessions/:path*",
    "/settings/:path*",
    "/users/:path*",
    "/vault/:path*",
    "/webhooks/:path*",
    "/welcome/:path*",
  ],
};
