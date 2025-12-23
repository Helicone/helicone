import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Image from "next/image";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PublicMetaData from "../components/layout/public/publicMetaData";
import useNotification from "../components/shared/notification/useNotification";
import { useHeliconeAuthClient } from "@/packages/common/auth/client/AuthClientFactory";
import { logger } from "@/lib/telemetry/logger";

const SSO = () => {
  const heliconeAuthClient = useHeliconeAuthClient();
  const router = useRouter();
  const { setNotification } = useNotification();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSSOSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const domain = email.split("@")[1];
    if (!domain) {
      setNotification("Please enter a valid email address.", "error");
      setIsLoading(false);
      return;
    }

    const { error } = await heliconeAuthClient.signInWithSSO({
      domain,
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      setNotification(
        "Error logging in with SSO. Please try again or contact your administrator or Helicone.",
        "error"
      );
      logger.error({ error }, "SSO sign in failed");
      setIsLoading(false);
      return;
    }
  };

  return (
    <PublicMetaData
      description="Sign in with SSO to Helicone"
      ogImageUrl="https://www.helicone.ai/static/helicone-og.webp"
    >
      <div className="flex min-h-screen items-center justify-center bg-white p-6">
        <div className="w-full max-w-md">
          <div className="mb-8 flex justify-center">
            <Link href="https://www.helicone.ai/" className="flex">
              <Image
                src="/static/logo.svg"
                alt="Helicone"
                height={80}
                width={80}
                priority={true}
              />
            </Link>
          </div>

          <div className="mb-8 text-center">
            <div className="mb-4 flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100">
                <Lock size={24} className="text-sky-600" />
              </div>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900">
              Sign in with SSO
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Enter your work email to continue with your organization&apos;s
              single sign-on.
            </p>
          </div>

          <form onSubmit={handleSSOSubmit} className="space-y-5">
            <div className="space-y-1">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Work email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="jane@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full"
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-sky-500 py-2 text-white"
            >
              {isLoading ? "Redirecting..." : "Continue with SSO"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/signin"
              className="text-sm text-sky-500 hover:text-sky-700"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </PublicMetaData>
  );
};

export default SSO;
