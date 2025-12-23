/* eslint-disable @next/next/no-img-element */
import { BsGoogle, BsGithub } from "react-icons/bs";
import { Lock } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { AuthBrandingPanel } from "./AuthBrandingPanel";

type CustomerPortalContent = {
  domain: string;
  logo: string;
};

interface AuthFormProps {
  handleEmailSubmit: (email: string, password: string) => void;
  handleGoogleSubmit?: () => void;
  handleGithubSubmit?: () => void;
  showSSOButton?: boolean;
  authFormType: "signin" | "signup" | "reset" | "reset-password";
  customerPortalContent?: CustomerPortalContent;
}

const AuthForm = (props: AuthFormProps) => {
  const {
    handleEmailSubmit,
    handleGoogleSubmit,
    handleGithubSubmit,
    showSSOButton,
    authFormType,
    customerPortalContent,
  } = props;

  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const router = useRouter();
  useEffect(() => {
    if (router.query.url && router.asPath) {
      const fullUrl = window.location.href;
      const startIndex = fullUrl.indexOf("url=");
      const urlParam = fullUrl.substring(startIndex + 4);
      const decodedUrl = decodeURIComponent(urlParam);

      window.location.href = decodedUrl as string;
    }
  }, [router.query, router.asPath]);

  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleEmailSubmitHandler = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setIsLoading(true);

    await handleEmailSubmit(email, password);
    setIsLoading(false);
  };

  const handleRouting = (regionEvent: "us" | "eu") => {
    // check if the current path contains `localhost`. if it does, don't do anything
    const basePath = window.location.href;

    if (basePath.includes("localhost")) {
      return;
    }

    if (regionEvent === "us") {
      const appUrl =
        process.env.NEXT_PUBLIC_APP_URL || "https://us.helicone.ai";
      router.push(appUrl + "/" + authFormType);
    }
    if (regionEvent === "eu") {
      router.push("https://eu.helicone.ai/" + authFormType);
    }
  };

  const checkPath = () => {
    // check if the base path has `us` or `eu` in it
    // if the window does not exist (for example, during SSR), return `us`
    if (typeof window === "undefined") {
      return "us";
    }

    const basePath = window.location.href;
    if (basePath.includes("us")) {
      return "us";
    }
    if (basePath.includes("eu")) {
      return "eu";
    }
    return "us";
  };

  return (
    <div className="flex h-screen w-full">
      {/* Left Panel - Branding and Visual Elements */}
      <AuthBrandingPanel />

      {/* Right Panel - Auth Form */}
      <div className="flex w-full flex-col items-center justify-center bg-white p-6 md:w-1/2 md:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="mb-8 flex justify-center md:hidden">
            <Link href="https://www.helicone.ai/" className="flex">
              <Image
                src={"/static/logo.svg"}
                alt="Helicone"
                height={80}
                width={80}
                priority={true}
              />
            </Link>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900">
              {authFormType === "signin"
                ? "Sign in to your account"
                : authFormType === "signup"
                  ? "Create an account"
                  : "Reset your password"}
            </h2>
            {authFormType === "signup" ? (
              <p className="mt-2 text-sm text-gray-600">
                Already have an account?{" "}
                <Link
                  href={"/signin"}
                  className="text-sky-500 hover:text-sky-700"
                >
                  Sign in here.
                </Link>
              </p>
            ) : (
              <p className="mt-2 text-sm text-gray-600">
                New to Helicone?{" "}
                <Link
                  href={"/signup"}
                  className="text-sky-500 hover:text-sky-700"
                >
                  Create an account here.
                </Link>
              </p>
            )}
          </div>

          <form
            action="#"
            method="POST"
            className="space-y-5"
            onSubmit={handleEmailSubmitHandler}
          >
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">
                Data region
              </label>
              <Select
                defaultValue={checkPath()}
                onValueChange={(value) => handleRouting(value as "us" | "eu")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="us">🇺🇸 United States</SelectItem>
                  <SelectItem value="eu">🇪🇺 European Union</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {authFormType !== "reset-password" && (
              <div className="space-y-1">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700"
                >
                  Email
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="jane@acme.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full"
                />
              </div>
            )}

            {authFormType !== "reset" && (
              <div className="space-y-1">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Password
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="***********"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full"
                />
              </div>
            )}

            {authFormType === "signup" && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="terms"
                  checked={acceptedTerms}
                  onCheckedChange={(checked) =>
                    setAcceptedTerms(checked as boolean)
                  }
                />
                <label htmlFor="terms" className="text-sm text-gray-600">
                  I accept the{" "}
                  <Link
                    href={"/terms"}
                    className="text-sky-500 hover:text-sky-700"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    href={"/privacy"}
                    className="text-sky-500 hover:text-sky-700"
                  >
                    Privacy Policy
                  </Link>
                  .
                </label>
              </div>
            )}

            {authFormType === "signin" && (
              <div className="flex justify-end">
                <Link
                  href={"/reset"}
                  className="text-sm text-sky-500 hover:text-sky-700"
                >
                  Forgot your password?
                </Link>
              </div>
            )}

            <Button
              type="submit"
              disabled={
                isLoading || (authFormType === "signup" && !acceptedTerms)
              }
              className="w-full bg-sky-500 py-2 text-white"
            >
              {authFormType === "signin"
                ? "Sign in with email"
                : authFormType === "signup"
                  ? "Create account"
                  : authFormType === "reset"
                    ? "Reset password"
                    : "Update password"}
            </Button>
          </form>

          {(handleGoogleSubmit || handleGithubSubmit || showSSOButton) && (
            <div className="mt-8">
              <div className="relative">
                <div
                  className="absolute inset-0 flex items-center"
                  aria-hidden="true"
                >
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-4 text-sm text-gray-500">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap justify-center gap-3">
                {handleGoogleSubmit && (
                  <button
                    onClick={() => handleGoogleSubmit()}
                    className="flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                  >
                    <BsGoogle />
                    <span>Google</span>
                  </button>
                )}
                {handleGithubSubmit && (
                  <button
                    onClick={() => handleGithubSubmit()}
                    className="flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                  >
                    <BsGithub />
                    <span>GitHub</span>
                  </button>
                )}
                {showSSOButton && (
                  <Link
                    href="/sso"
                    className="flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                  >
                    <Lock size={14} />
                    <span>SSO</span>
                  </Link>
                )}
              </div>
            </div>
          )}

          {customerPortalContent && (
            <div className="mt-8 text-center text-xs italic text-gray-500">
              Powered by Helicone
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
