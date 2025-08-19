import { betterAuth, logger } from "better-auth";
import { fromNodeHeaders } from "better-auth/node";
import { customSession, emailOTP } from "better-auth/plugins";
import { Pool } from "pg";
import { Database } from "../../../../lib/db/database.types";
import { dbExecute } from "../../../../lib/shared/db/dbExecute";
import crypto from "crypto";
import {
  GenericHeaders,
  HeliconeAuthClient,
} from "../../auth/server/HeliconeAuthClient";
import {
  AuthParams,
  HeliconeAuth,
  HeliconeUserResult,
  JwtAuth,
  OrgParams,
  OrgResult,
  Role,
} from "../../auth/types";
import { err, ok, Result } from "../../result";
import { authenticateBearer } from "./common";
import nodemailer from "nodemailer";

// Create a reusable transporter object using the default SMTP transport
// Configure for MailHog in development, or your actual email service in production
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? "localhost",
  port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 1025,
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
  
  // Only add auth if credentials are actually provided
  ...(process.env.SMTP_USER && process.env.SMTP_PASS
    ? {
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      }
    : {}), // No auth if credentials are missing
  
  // Disable TLS for local development
  tls: {
    rejectUnauthorized: false, // Allow self-signed certificates
  },
  
  // Disable auth requirement for local SMTP
  ignoreTLS: process.env.NODE_ENV === "development" || !process.env.SMTP_HOST,
});
// Add the emailOTP plugin to betterAuth
export const betterAuthClient = betterAuth({
  database: new Pool({
    connectionString: process.env.SUPABASE_DATABASE_URL,
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    autoSignInAfterVerification: true
  },
  logger: {
    log: (message: string) => {
      console.log(message);
    },
  },
  plugins: [
    customSession(async ({ user, session }) => {
      const dbUser = await getUserByBetterAuthId(user.id);
      if (dbUser.error || !dbUser.data) {
        logger.warn("could not fetch authUserId from db");
        return {
          user,
          session,
        };
      }

      return {
        user: {
          authUserId: dbUser.data.id,
          ...user,
        },
        session,
      };
    }),
    emailOTP({
      // Implement actual email sending with nodemailer
      async sendVerificationOTP({ email, otp, type }) {
        try {
          const subject = "Verify your email address for Helicone";
      const emailHtml = `
<div style="width: 100%; background-color: #ffffff">
  <div style="margin: 0px auto; padding: 16px; width: 512px">
    <img width="160" alt="Helicone Logo" src="${process.env.NEXT_PUBLIC_APP_URL || "https://us.helicone.ai"}/_next/image?url=%2Fstatic%2Flogo-no-border.png&w=384&q=75">
    <p style="font-size: 16px;">Hey there 👋,</p> <!-- Removed extra </h1> -->
    <p style="font-size: 16px;">Thank you for joining our community of thousands of developers. To get started, please click the button below:</p>
    <!-- Use the 'url' variable provided by better-auth -->
    <a style="margin: 16px 0px; display: inline-block; background-color: #0CA5E9; color: #ffffff; font-size: 12px; font-weight: bold; text-decoration: none; padding: 8px 16px; border-radius: 8px; border: 2px solid #036aa1" href="${url}">Start Building</a>
    
    <div>
      <h3>Tips and Tricks 🪄</h3>
      <ul>
        <li>Use <a href="https://docs.helicone.ai/features/advanced-usage/custom-properties" target="_blank" rel="noopener noreferrer">custom properties</a> to segment requests by categories / labels</li>
        <li>Leverage <a href="https://docs.helicone.ai/features/advanced-usage/caching" target="_blank" rel="noopener noreferrer">caching</a> to save money on development costs with LLMs</li>
        <li>Utilize <a href="https://docs.helicone.ai/features/prompts/intro" target="_blank" rel="noopener noreferrer">prompt templates</a> to visualize and experiment with prompt versions and iterations</li>
      </ul> <!-- Corrected closing tag -->
    </div>
    
    <div style="border-top: 1px solid #cccccc; padding: 16px 0px; font-size: 12px;">
      <p style="margin: 0;">If you have any questions or need assistance, please don't hesitate to contact us at sales@helicone.com</p>
      <p style="margin: 0;">Happy Building!</p>
      <p style="margin: 0;">The Helicone Team</p>
    </div>
  </div>
</div>
      `;


          console.log("sending email to", email);
          await transporter.sendMail({
            from: process.env.SMTP_FROM ?? "no-reply@helicone.ai",
            to: email,
            subject,
            html: emailHtml,
          });
          console.log("EMAIL SENT");

          // For development/debugging, also log to console
          if (
            process.env.SMTP_HOST?.includes("mailhog") ||
            process.env.NODE_ENV === "development"
          ) {
            console.log(
              `[BetterAuth EmailOTP] Sent OTP "${otp}" to "${email}" for type "${type}"`
            );
          }
        } catch (error) {
          console.error(
            `[BetterAuth EmailOTP] Failed to send OTP to "${email}":`,
            error
          );
          throw new Error("Failed to send verification email");
        }
      },
      // Optionally, you can add more config here (otpLength, expiresIn, etc.)
      // overrideDefaultEmailVerification: true, // Uncomment if you want to use OTP for email verification instead of links
    }),
  ],
});
export class BetterAuthWrapper implements HeliconeAuthClient {
  constructor() {}

  async getUser(auth: JwtAuth, headers?: GenericHeaders): HeliconeUserResult {
    if (!headers) {
      return err("No headers provided");
    }
    const hds = fromNodeHeaders(headers);

    const session = await betterAuthClient.api.getSession({
      headers: hds,
    });
    if (!session) {
      return err("Invalid session");
    }

    const user = await dbExecute<{
      user_id: string;
      email: string;
    }>(
      `SELECT 
        public.user.auth_user_id as user_id, 
        public.user.email
      FROM public.user
      LEFT JOIN auth.users on public.user.auth_user_id = auth.users.id
      WHERE public.user.id = $1`,
      [session.user.id]
    );
    if (!user || !user.data?.[0]) {
      return err("User not found");
    }

    return ok({
      id: user.data?.[0]?.user_id,
      email: user.data?.[0]?.email,
    });
  }

  async getUserById(userId: string): HeliconeUserResult {
    throw new Error("Not implemented");
  }

  async getUserByEmail(email: string): HeliconeUserResult {
    const user = await dbExecute<{
      user_id: string;
      email: string;
    }>(
      `SELECT 
        public.user.auth_user_id as user_id, 
        public.user.email
      FROM public.user
      LEFT JOIN auth.users on public.user.auth_user_id = auth.users.id
      WHERE public.user.email = $1`,
      [email],
    );
    if (!user || !user.data?.[0]) {
      return err("User not found");
    }

    console.log("user", user.data?.[0]);
  
    return ok({
      id: user.data?.[0]?.user_id,
      email: user.data?.[0]?.email,
    });
  }

  async authenticate(
    auth: HeliconeAuth,
    headers?: GenericHeaders
  ): Promise<Result<AuthParams, string>> {
    if (auth._type === "jwt") {
      const user = await this.getUser(auth, headers);
      if (user.error) {
        return err(user.error);
      }
      const org = await dbExecute<
        Database["public"]["Tables"]["organization"]["Row"] & {
          role: Role;
        }
      >(
        `SELECT organization.*, organization_member.org_role as role FROM organization 
  left join organization_member on organization_member.organization = organization.id
  where 
  organization.id = $1
  and organization_member.member = $2
  limit 1
  `,
        [auth.orgId, user.data?.id]
      );

      if (!org?.data?.[0]?.id || !org?.data?.[0]?.role) {
        return err("Invalid organization");
      }

      return ok({
        user: user.data,
        userId: user.data?.id,
        organizationId: org?.data?.[0]?.id ?? "",
        role: org?.data?.[0]?.role ?? "member",
        tier: org?.data?.[0]?.tier ?? "free",
      });
    } else if (auth._type === "bearer") {
      return authenticateBearer(auth.token);
    }

    return err("Not implemented");
  }

  private async uncachedGetOrganization(
    authParams: AuthParams
  ): Promise<OrgResult> {
    const org = await dbExecute<
      Database["public"]["Tables"]["organization"]["Row"] & {
        role: Role;
      }
    >(
      `SELECT organization.*, organization_member.org_role as role FROM organization 
left join organization_member on organization_member.organization = organization.id
where 
organization.id = $1
and organization_member.member = $2
limit 1
`,
      [authParams.organizationId, authParams.userId]
    );

    const orgResult: OrgParams = {
      tier: org?.data?.[0]?.tier ?? "free",
      id: org?.data?.[0]?.id ?? "",
      percentLog: org?.data?.[0]?.percent_to_log ?? 100_000,
      has_onboarded: org?.data?.[0]?.has_onboarded ?? false,
      has_integrated: org?.data?.[0]?.has_integrated ?? false,
    };

    return ok(orgResult);
  }

  async getOrganization(
    authParams: AuthParams
  ): Promise<Result<OrgParams, string>> {
    return await this.uncachedGetOrganization(authParams);
  }

  async createUser({
    email,
    password,
    otp,
  }: {
    email: string;
    password?: string;
    otp?: boolean;
  }): HeliconeUserResult {
    try {
      const randomPassword = crypto.randomBytes(18).toString("base64url");
      const result = await betterAuthClient.api.signUpEmail({
        body: {
          email: email,
          password: randomPassword,
          name: "",
        },
      });
      if (result.user) {
        const data = await betterAuthClient.api.sendVerificationOTP({
          body: {
              email: email,
              type: "email-verification",
          },
        });
        if (!data.success) {
          return err("Failed to send verification OTP");
        }

        return ok({
          id: result.user.id,
          email: result.user.email ?? "",
        });
      }

      return err("Signup process outcome unclear. Check verification steps.");
    } catch (error: any) {
      logger.error(error.message || "Better Auth sign up error");
      return err(error.message || "Sign up failed");
    }
  }
}

async function getUserByBetterAuthId(userId: string): HeliconeUserResult {
  const user = await dbExecute<{
    user_id: string;
    email: string;
  }>(
    `SELECT 
      public.user.auth_user_id as user_id, 
      public.user.email
    FROM public.user
    LEFT JOIN auth.users on public.user.auth_user_id = auth.users.id
    WHERE public.user.id = $1`,
    [userId],
  );
  if (!user || !user.data?.[0]) {
    return err("User not found");
  }

  return ok({
    id: user.data?.[0]?.user_id,
    email: user.data?.[0]?.email,
  });
}