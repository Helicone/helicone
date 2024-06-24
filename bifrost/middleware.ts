// middleware.ts

import { NextResponse, NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const pathname = url.pathname;

  switch (pathname) {
    case "/dashboard":
      return NextResponse.redirect("https://us.helicone.ai/dashboard", 301);
    case "/job":
    case "/career":
      return NextResponse.redirect(
        "https://helicone.notion.site/Helicone-Job-Board-a0a37e35da6e41cc9ace3030f0d04a10?pvs=4",
        301
      );
    case "/developer":
      return NextResponse.redirect("https://us.helicone.ai/developer", 301);
    case "/features/customer-portal":
      return NextResponse.redirect(
        "https://docs.helicone.ai/features/customer-portal",
        301
      );
    case "/prompts":
      return NextResponse.redirect("https://us.helicone.ai/prompts", 301);
    case "/requests":
      return NextResponse.redirect("https://us.helicone.ai/requests", 301);
    case "/roadmap":
      return NextResponse.redirect("https://us.helicone.ai/roadmap", 301);
    default:
      return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/career",
    "/developer",
    "/features/customer-portal",
    "/job",
    "/prompts",
    "/requests",
    "/roadmap",
    "/dashboard",
  ],
};
