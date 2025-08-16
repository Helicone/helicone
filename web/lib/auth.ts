import { betterAuth } from "better-auth";
import { customSession } from "better-auth/plugins";
import { getUser } from "@/packages/common/toImplement/server/useBetterAuthClient";
import { Pool } from "pg";
import nodemailer from "nodemailer";
import { logger } from "@/lib/telemetry/logger";

// Create a reusable transporter object using the default SMTP transport
// Configure for MailHog in development, or your actual email service in production
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST ?? "localhost",
  port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 1025,
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports

  // Don't use auth for MailHog, but use it for production SMTP servers
  ...(process.env.SMTP_HOST?.includes("mailhog") ||
  process.env.NODE_ENV === "development"
    ? {} // No auth for MailHog
    : {
        auth: {
          user: process.env.SMTP_USER || "",
          pass: process.env.SMTP_PASS || "",
        },
      }),

  // MailHog doesn't need TLS verification
  tls:
    process.env.SMTP_HOST?.includes("mailhog") ||
    process.env.NODE_ENV === "development"
      ? { rejectUnauthorized: false }
      : undefined,
});

export const auth = betterAuth({
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
  },
  emailVerification: {
    sendOnSignUp: true,
    // Define the function to send the verification email
    sendVerificationEmail: async ({ user, url }, request) => {
      logger.info({ email: user.email }, "Sending verification email");
      // Define your email content using the provided HTML template
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

      // Send mail with defined transport object
      try {
        const info = await transporter.sendMail({
          from: '"Helicone" <no-reply@helicone.ai>', // Sender address
          to: user.email, // List of receivers
          subject: "Verify your email address", // Subject line
          html: emailHtml, // html body
        });

        logger.info({ messageId: info.messageId }, "Verification email sent");
        // In development, you can also log the URL for easy access:
        if (process.env.NODE_ENV === "development") {
          logger.info({ url }, "Verification URL");
        }
      } catch (error) {
        logger.error({ error }, "Error sending verification email");
        logger.error(
          {
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.SMTP_SECURE === "true",
            hasAuth: !process.env.SMTP_HOST?.includes("mailhog"),
          },
          "SMTP Config",
        );
        // Optionally, re-throw the error or handle it as needed
        // throw error;
      }
    },
  },
  trustedOrigins: [process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3008"],
  plugins: [
    customSession(async ({ user, session }) => {
      const dbUser = await getUser(user.id);
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
  ],
});
