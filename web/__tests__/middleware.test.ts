/**
 * Unit tests for the middleware that redirects non-prefixed dashboard domains
 * to regional sign-in pages based on geolocation.
 */

import { NextRequest } from "next/server";

// Mock NextResponse before importing middleware
jest.mock("next/server", () => {
  const originalModule = jest.requireActual("next/server");
  return {
    ...originalModule,
    NextResponse: {
      next: jest.fn(() => ({ type: "next" })),
      redirect: jest.fn((url: URL) => ({ type: "redirect", url: url.toString() })),
    },
  };
});

// Import after mocks are set up
import { middleware } from "../middleware";
import { NextResponse } from "next/server";

describe("middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createMockRequest = (
    pathname: string,
    host: string,
    countryCode: string | null = null
  ): NextRequest => {
    const url = new URL(`https://${host}${pathname}`);
    const headers = new Headers();
    headers.set("host", host);
    if (countryCode) {
      headers.set("x-vercel-ip-country", countryCode);
    }

    return {
      nextUrl: url,
      headers,
    } as unknown as NextRequest;
  };

  describe("isProtectedRoute", () => {
    it("should identify /dashboard as a protected route", () => {
      const request = createMockRequest("/dashboard", "helicone.ai", "US");
      middleware(request);
      expect(NextResponse.redirect).toHaveBeenCalled();
    });

    it("should identify /alerts as a protected route", () => {
      const request = createMockRequest("/alerts", "helicone.ai", "US");
      middleware(request);
      expect(NextResponse.redirect).toHaveBeenCalled();
    });

    it("should identify nested dashboard routes as protected", () => {
      const request = createMockRequest("/settings/billing", "helicone.ai", "US");
      middleware(request);
      expect(NextResponse.redirect).toHaveBeenCalled();
    });

    it("should NOT redirect non-protected routes like /signin", () => {
      const request = createMockRequest("/signin", "helicone.ai", "US");
      middleware(request);
      expect(NextResponse.redirect).not.toHaveBeenCalled();
      expect(NextResponse.next).toHaveBeenCalled();
    });
  });

  describe("isNonPrefixedDomain", () => {
    it("should NOT redirect requests from us.helicone.ai", () => {
      const request = createMockRequest("/dashboard", "us.helicone.ai", "US");
      middleware(request);
      expect(NextResponse.redirect).not.toHaveBeenCalled();
      expect(NextResponse.next).toHaveBeenCalled();
    });

    it("should NOT redirect requests from eu.helicone.ai", () => {
      const request = createMockRequest("/dashboard", "eu.helicone.ai", "DE");
      middleware(request);
      expect(NextResponse.redirect).not.toHaveBeenCalled();
      expect(NextResponse.next).toHaveBeenCalled();
    });

    it("should NOT redirect requests from localhost", () => {
      const request = createMockRequest("/dashboard", "localhost:3000", "US");
      middleware(request);
      expect(NextResponse.redirect).not.toHaveBeenCalled();
      expect(NextResponse.next).toHaveBeenCalled();
    });

    it("should NOT redirect requests from Vercel preview deployments", () => {
      const request = createMockRequest(
        "/dashboard",
        "helicone-abc123.vercel.app",
        "US"
      );
      middleware(request);
      expect(NextResponse.redirect).not.toHaveBeenCalled();
      expect(NextResponse.next).toHaveBeenCalled();
    });

    it("should redirect requests from helicone.ai", () => {
      const request = createMockRequest("/dashboard", "helicone.ai", "US");
      middleware(request);
      expect(NextResponse.redirect).toHaveBeenCalled();
    });

    it("should redirect requests from www.helicone.ai", () => {
      const request = createMockRequest("/dashboard", "www.helicone.ai", "US");
      middleware(request);
      expect(NextResponse.redirect).toHaveBeenCalled();
    });
  });

  describe("geolocation-based routing", () => {
    it("should redirect US users to us.helicone.ai/signin", () => {
      const request = createMockRequest("/dashboard", "helicone.ai", "US");
      middleware(request);

      expect(NextResponse.redirect).toHaveBeenCalledWith(
        expect.objectContaining({
          toString: expect.any(Function),
        })
      );

      const redirectCall = (NextResponse.redirect as jest.Mock).mock.calls[0][0];
      expect(redirectCall.origin).toBe("https://us.helicone.ai");
      expect(redirectCall.pathname).toBe("/signin");
    });

    it("should redirect German users to eu.helicone.ai/signin", () => {
      const request = createMockRequest("/dashboard", "helicone.ai", "DE");
      middleware(request);

      const redirectCall = (NextResponse.redirect as jest.Mock).mock.calls[0][0];
      expect(redirectCall.origin).toBe("https://eu.helicone.ai");
      expect(redirectCall.pathname).toBe("/signin");
    });

    it("should redirect French users to eu.helicone.ai/signin", () => {
      const request = createMockRequest("/dashboard", "helicone.ai", "FR");
      middleware(request);

      const redirectCall = (NextResponse.redirect as jest.Mock).mock.calls[0][0];
      expect(redirectCall.origin).toBe("https://eu.helicone.ai");
      expect(redirectCall.pathname).toBe("/signin");
    });

    it("should redirect UK users to eu.helicone.ai/signin", () => {
      const request = createMockRequest("/dashboard", "helicone.ai", "GB");
      middleware(request);

      const redirectCall = (NextResponse.redirect as jest.Mock).mock.calls[0][0];
      expect(redirectCall.origin).toBe("https://eu.helicone.ai");
      expect(redirectCall.pathname).toBe("/signin");
    });

    it("should redirect Canadian users to us.helicone.ai/signin", () => {
      const request = createMockRequest("/dashboard", "helicone.ai", "CA");
      middleware(request);

      const redirectCall = (NextResponse.redirect as jest.Mock).mock.calls[0][0];
      expect(redirectCall.origin).toBe("https://us.helicone.ai");
      expect(redirectCall.pathname).toBe("/signin");
    });

    it("should redirect Japanese users to us.helicone.ai/signin (default to US for non-EU)", () => {
      const request = createMockRequest("/dashboard", "helicone.ai", "JP");
      middleware(request);

      const redirectCall = (NextResponse.redirect as jest.Mock).mock.calls[0][0];
      expect(redirectCall.origin).toBe("https://us.helicone.ai");
      expect(redirectCall.pathname).toBe("/signin");
    });

    it("should default to US when no country code is available", () => {
      const request = createMockRequest("/dashboard", "helicone.ai", null);
      middleware(request);

      const redirectCall = (NextResponse.redirect as jest.Mock).mock.calls[0][0];
      expect(redirectCall.origin).toBe("https://us.helicone.ai");
      expect(redirectCall.pathname).toBe("/signin");
    });
  });

  describe("returnTo parameter", () => {
    it("should include the original path in returnTo query parameter", () => {
      const request = createMockRequest("/alerts", "helicone.ai", "US");
      middleware(request);

      const redirectCall = (NextResponse.redirect as jest.Mock).mock.calls[0][0];
      expect(redirectCall.searchParams.get("returnTo")).toBe("/alerts");
    });

    it("should preserve nested paths in returnTo", () => {
      const request = createMockRequest("/settings/billing", "helicone.ai", "US");
      middleware(request);

      const redirectCall = (NextResponse.redirect as jest.Mock).mock.calls[0][0];
      expect(redirectCall.searchParams.get("returnTo")).toBe("/settings/billing");
    });
  });
});
