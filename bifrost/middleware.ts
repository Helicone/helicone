// middleware.ts

import { NextResponse, NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const pathname = url.pathname;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 
    (process.env.NODE_ENV === "development" ? "http://localhost:3000" : "https://us.helicone.ai");

  // Handle existing redirects first
  switch (pathname) {
    case "/dashboard":
      return NextResponse.redirect(`${appUrl}/dashboard`, 301);
    case "/job":
    case "/career":
      return NextResponse.redirect(
        "https://helicone.notion.site/Helicone-Job-Board-a0a37e35da6e41cc9ace3030f0d04a10?pvs=4",
        301
      );
    case "/developer":
      return NextResponse.redirect(`${appUrl}/developer`, 301);
    case "/features/customer-portal":
      return NextResponse.redirect(
        "https://docs.helicone.ai/features/customer-portal",
        301
      );
    case "/prompts":
      return NextResponse.redirect(`${appUrl}/prompts`, 301);
    case "/requests":
      return NextResponse.redirect(`${appUrl}/requests`, 301);
    case "/alerts":
      return NextResponse.redirect(`${appUrl}/alerts`, 301);
  }

  // Continue to next middleware or page
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/career",
    "/developer",
    "/features/customer-portal",
    "/job",
    "/prompts",
    "/requests",
    "/dashboard",
    "/alerts",
  ],
};
