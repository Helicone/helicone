import cors from "cors";
import { ENVIRONMENT } from "../lib/clients/constant";
import { IS_ON_PREM } from "../constants/IS_ON_PREM";

const allowedOriginsEnv = {
  production: [
    /^https?:\/\/(www\.)?helicone\.ai$/,
    /^https?:\/\/(www\.)?.*-helicone\.vercel\.app$/,
    /^https?:\/\/(www\.)?helicone\.vercel\.app$/,
    /^https?:\/\/(www\.)?helicone-git-valhalla-use-jawn-to-read-helicone\.vercel\.app$/,
    /^http:\/\/localhost:3000$/,
    /^http:\/\/localhost:3001$/,
    /^http:\/\/localhost:3002$/,
    /^https?:\/\/(www\.)?eu\.helicone\.ai$/, // Added eu.helicone.ai
    /^https?:\/\/(www\.)?us\.helicone\.ai$/,
  ],
  development: [
    /^http:\/\/localhost:3000$/,
    /^http:\/\/localhost:3001$/,
    /^http:\/\/localhost:3002$/,
  ],
  preview: [
    /^http:\/\/localhost:3000$/,
    /^http:\/\/localhost:3001$/,
    /^http:\/\/localhost:3002$/,
  ],
};

function isOriginAllowed(origin: string): boolean {
  const allowedOrigins = allowedOriginsEnv[ENVIRONMENT];
  return allowedOrigins.some((allowedOrigin) => allowedOrigin.test(origin));
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