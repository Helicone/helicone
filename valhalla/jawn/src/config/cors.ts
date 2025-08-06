import cors from "cors";
import { ENVIRONMENT } from "../lib/clients/constant";
import { IS_ON_PREM } from "../constants/IS_ON_PREM";

// Helper function to check if origin matches allowed patterns
function isOriginAllowed(origin: string): boolean {
  try {
    const originUrl = new URL(origin);
    const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    
    // Check if it matches the configured app URL
    if (origin === appUrl) return true;
    
    // Production-specific checks
    if (ENVIRONMENT === "production") {
      const hostname = originUrl.hostname;
      
      // Check specific domains
      if (hostname === "helicone.ai" || hostname === "www.helicone.ai") return true;
      if (hostname === "eu.helicone.ai" || hostname === "www.eu.helicone.ai") return true;
      if (hostname === "us.helicone.ai" || hostname === "www.us.helicone.ai") return true;
      
      // Check Vercel preview URLs
      if (hostname.endsWith("-helicone.vercel.app") || 
          hostname === "helicone.vercel.app" ||
          hostname === "www.helicone.vercel.app") return true;
    }
    
    // For development/preview, just check against the app URL
    return origin === appUrl;
  } catch {
    return false;
  }
}

export const corsOptions = {
  origin: function (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) {
    if (!origin) {
      // Allow requests with no origin (like server-to-server, curl)
      callback(null, true);
      return;
    }
    
    if (isOriginAllowed(origin) || IS_ON_PREM) {
      callback(null, true);
    } else {
      // Important: Disallow origins not in the list
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Helicone-Authorization",
    "x-vercel-set-bypass-cookie",
    "x-vercel-protection-bypass",
  ],
  credentials: true,
  optionsSuccessStatus: 204,
};

export function configureCors(app: any) {
  app.options("/{*any}", cors(corsOptions));
  app.use(cors(corsOptions));
} 