/* eslint-disable @next/next/no-img-element */
import { BsGoogle, BsGithub } from "react-icons/bs";
import { SiOkta } from "react-icons/si";
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

type CustomerPortalContent = {
  domain: string;
  logo: string;
};

interface AuthFormProps {
  handleEmailSubmit: (email: string, password: string) => void;
  handleGoogleSubmit?: () => void;
  handleGithubSubmit?: () => void;
  handleOktaSubmit?: (email: string) => void;
  authFormType: "signin" | "signup" | "reset" | "reset-password";
  customerPortalContent?: CustomerPortalContent;
}

const AuthForm = (props: AuthFormProps) => {
  const {
    handleEmailSubmit,
    handleGoogleSubmit,
    handleGithubSubmit,
    handleOktaSubmit,
    authFormType,
    customerPortalContent,
  } = props;

  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Array of images to randomly select from
  const centerImages = [
    "/static/onboarding-design-1.svg",
    "/static/onboarding-design-2.svg",
  ];

  // Array of quotes to randomly select from
  const quotes = [
    {
      text: "The ability to test prompt variations on production traffic without touching a line of code is magical. It feels like we're cheating; it's just that good!",
      highlights: [
        {
          text: "It feels like we're cheating; it's just that good!",
          color: "text-slate-800",
        },
      ],
      author: "Nishant Shukla",
      title: "Sr. Director of AI at QA Wolf",
      image: "/static/qawolf-logo.svg",
    },
    {
      text: "Thank you for an excellent observability platform! I pretty much use it for all my AI apps now.",
      highlights: [
        {
          text: "I pretty much use it for all my AI apps now.",
          color: "text-slate-800",
        },
      ],
      author: "Hassan El Mghari",
      title: "DevRel Lead at Together AI",
      image: "/static/together-logo.svg",
    },
  ];

  // Function to highlight keywords in quotes
  const highlightText = (
    text: string,
    highlights: { text: string; color: string }[],
  ) => {
    if (!highlights || highlights.length === 0) return <>{text}</>;

    let result = [];
    let lastIndex = 0;

    // Sort highlights by their position in the text to process them in order
    const sortedHighlights = [...highlights].sort((a, b) => {
      return text.indexOf(a.text) - text.indexOf(b.text);
    });

    for (const highlight of sortedHighlights) {
      const index = text.indexOf(highlight.text, lastIndex);
      if (index === -1) continue; // Skip if the highlight text isn't found

      // Add the text before the highlight
      if (index > lastIndex) {
        result.push(
          <span key={`text-${lastIndex}`}>
            {text.substring(lastIndex, index)}
          </span>,
        );
      }

      // Add the highlighted text with consistent slate-800 color
      result.push(
        <span key={`highlight-${index}`} className="text-slate-800">
          {highlight.text}
        </span>,
      );

      lastIndex = index + highlight.text.length;
    }

    // Add any remaining text after the last highlight
    if (lastIndex < text.length) {
      result.push(
        <span key={`text-${lastIndex}`}>{text.substring(lastIndex)}</span>,
      );
    }

    return <>{result}</>;
  };

  // State for the randomly selected image and quote
  const [selectedImage, setSelectedImage] = useState(centerImages[0]);
  const [selectedQuote, setSelectedQuote] = useState(quotes[0]);
  // State to determine whether to show the quote or the image
  const [showQuote, setShowQuote] = useState(false);
  const [isContentLoaded, setIsContentLoaded] = useState(false);

  useEffect(() => {
    const preloadImages = async () => {
      const imagePromises = centerImages.map((src) => {
        return new Promise((resolve) => {
          const img = new window.Image();
          img.src = src;
          img.onload = resolve;
        });
      });

      const quoteImagePromises = quotes.map((quote) => {
        return new Promise((resolve) => {
          const img = new window.Image();
          img.src = quote.image;
          img.onload = resolve;
        });
      });

      await Promise.all([...imagePromises, ...quoteImagePromises]);

      const randomImgIndex = Math.floor(Math.random() * centerImages.length);
      setSelectedImage(centerImages[randomImgIndex]);

      const randomQuoteIndex = Math.floor(Math.random() * quotes.length);
      setSelectedQuote(quotes[randomQuoteIndex]);

      // Randomly decide whether to show the quote or the image
      setShowQuote(Math.random() > 0.5);

      // Mark content as loaded to show it
      setIsContentLoaded(true);
    };

    preloadImages();
  }, []);

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
    event: FormEvent<HTMLFormElement>,
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
      <div
        className={`relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-100 to-sky-100 p-10 md:m-4 md:flex md:w-1/2 md:rounded-3xl`}
      >
        <div className="relative z-20">
          <div className="flex items-center justify-between gap-4">
            <Link href="https://www.helicone.ai/" className="flex">
              <Image
                src={"/static/logo-no-border.png"}
                alt="Helicone - Open-source LLM observability and monitoring platform for developers."
                height={100}
                width={100}
                priority={true}
              />
            </Link>
            <a
              href="https://www.producthunt.com/posts/helicone-ai"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center"
            >
              <Image
                src="/static/product-of-the-day.svg"
                alt="#1 Product of the Day"
                width={120}
                height={26}
              />
            </a>
          </div>
        </div>

        {/* Center Image - Only shown when showQuote is false */}
        {!showQuote && isContentLoaded && (
          <div className="absolute inset-0 z-10 transition-opacity duration-300">
            <Image
              src={selectedImage}
              alt="Helicone Featured Image"
              fill
              style={{ objectFit: "cover" }}
              className="h-full w-full"
              priority={true}
            />
          </div>
        )}

        {/* Quote - Only shown when showQuote is true */}
        {showQuote && isContentLoaded ? (
          <>
            <div className="relative z-20 w-full space-y-3">
              <h1 className="text-4xl font-extrabold text-slate-300">&quot;</h1>
              <p className="w-full text-4xl font-medium text-slate-400">
                {highlightText(selectedQuote.text, selectedQuote.highlights)}
              </p>
              <h1 className="text-4xl font-bold text-slate-300">&quot;</h1>
            </div>

            {/* Name and logo - Only shown with quote */}
            <div className="relative z-20 flex items-center gap-3 space-y-1">
              <Image
                src={selectedQuote.image}
                alt={selectedQuote.author}
                width={48}
                height={48}
                className="rounded-full"
              />
              <div>
                <p className="text-md max-w-md text-slate-500">
                  {selectedQuote.author}
                </p>
                <p className="max-w-md text-sm text-slate-400">
                  {selectedQuote.title}
                </p>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Empty middle section when showing image */}
            <div className="flex-grow"></div>

            {/* Attribution at bottom when showing image */}
            <div className="relative z-20 flex items-center gap-3 space-y-1">
              <div>
                <p className="text-md max-w-md text-slate-500">
                  Designed for the entire LLM lifecycle
                </p>
                <p className="max-w-md text-sm text-slate-400">
                  The CI workflow to take your LLM application from MVP to
                  production.
                </p>
              </div>
            </div>
          </>
        )}
      </div>

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

          {(handleGoogleSubmit || handleGithubSubmit || handleOktaSubmit) && (
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

              <div className="mt-6 grid grid-cols-3 gap-3">
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
                {handleOktaSubmit && (
                  <button
                    onClick={() => handleOktaSubmit(email)}
                    className="flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                  >
                    <SiOkta />
                    <span>Okta</span>
                  </button>
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
