// middleware.ts

import { NextResponse, NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const pathname = url.pathname;

  // Handle existing redirects first
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
  }

  // Prerender.io integration
  const userAgent = request.headers.get("user-agent");
  const bots = [
    "googlebot",
    "yahoo! slurp",
    "bingbot",
    "yandex",
    "baiduspider",
    "facebookexternalhit",
    "twitterbot",
    "rogerbot",
    "linkedinbot",
    "embedly",
    "quora link preview",
    "showyoubot",
    "outbrain",
    "pinterest/0.",
    "developers.google.com/+/web/snippet",
    "slackbot",
    "vkshare",
    "w3c_validator",
    "redditbot",
    "applebot",
    "whatsapp",
    "flipboard",
    "tumblr",
    "bitlybot",
    "skypeuripreview",
    "nuzzel",
    "discordbot",
    "google page speed",
    "qwantify",
    "pinterestbot",
    "bitrix link preview",
    "xing-contenttabreceiver",
    "chrome-lighthouse",
    "telegrambot",
    "OAI-SearchBot",
    "ChatGPT",
    "GPTBot",
    "Perplexity",
    "ClaudeBot",
    "Amazonbot",
    "integration-test",
  ];

  const IGNORE_EXTENSIONS = [
    ".js",
    ".css",
    ".xml",
    ".less",
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".pdf",
    ".doc",
    ".txt",
    ".ico",
    ".rss",
    ".zip",
    ".mp3",
    ".rar",
    ".exe",
    ".wmv",
    ".doc",
    ".avi",
    ".ppt",
    ".mpg",
    ".mpeg",
    ".tif",
    ".wav",
    ".mov",
    ".psd",
    ".ai",
    ".xls",
    ".mp4",
    ".m4a",
    ".swf",
    ".dat",
    ".dmg",
    ".iso",
    ".flv",
    ".m4v",
    ".torrent",
    ".woff",
    ".ttf",
    ".svg",
    ".webmanifest",
  ];

  const isBot =
    userAgent && bots.some((bot) => userAgent.toLowerCase().includes(bot));
  const isPrerender = request.headers.get("X-Prerender");
  const extension = pathname.slice(((pathname.lastIndexOf(".") - 1) >>> 0) + 1);

  if (
    isPrerender ||
    !isBot ||
    (extension.length && IGNORE_EXTENSIONS.includes(`.${extension}`))
  ) {
    return NextResponse.next();
  }

  // Handle prerendering for bots
  const newURL = `https://service.prerender.io/${request.url}`;
  const newHeaders = new Headers(request.headers);
  newHeaders.set("X-Prerender-Token", process.env.PRERENDER_TOKEN || "");
  newHeaders.set("X-Prerender-Int-Type", "NextJS");

  try {
    const res = await fetch(
      new Request(newURL, {
        headers: newHeaders,
        redirect: "manual",
      })
    );

    const responseHeaders = new Headers(res.headers);
    responseHeaders.set("X-Redirected-From", request.url);

    const { readable, writable } = new TransformStream();
    res.body?.pipeTo(writable);

    return new NextResponse(readable, {
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
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
