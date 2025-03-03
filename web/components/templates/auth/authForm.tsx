/* eslint-disable @next/next/no-img-element */
import { BsGoogle, BsGithub } from "react-icons/bs";
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
  authFormType: "signin" | "signup" | "reset" | "reset-password";
  customerPortalContent?: CustomerPortalContent;
}

// Define background style options
type BackgroundStyle = {
  gradient: string;
  pattern: React.ReactNode;
  accentColor: string;
};

const backgroundStyles: BackgroundStyle[] = [
  {
    gradient: "bg-gradient-to-br from-slate-500 to-slate-300",
    pattern: (
      <svg className="h-full w-full" aria-hidden="true">
        <defs>
          <pattern
            id="grid-pattern-1"
            width={25}
            height={25}
            patternUnits="userSpaceOnUse"
          >
            <path d="M25 0V25M0 25H25" fill="none" stroke="white" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-pattern-1)" />
      </svg>
    ),
    accentColor: "text-blue-600 hover:text-blue-800",
  },
  {
    gradient: "bg-gradient-to-br from-purple-500 to-pink-500",
    pattern: (
      <svg className="h-full w-full" aria-hidden="true">
        <defs>
          <pattern
            id="grid-pattern-2"
            width={20}
            height={20}
            patternUnits="userSpaceOnUse"
          >
            <circle cx="10" cy="10" r="2" fill="white" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-pattern-2)" />
      </svg>
    ),
    accentColor: "text-purple-600 hover:text-purple-800",
  },
  {
    gradient: "bg-gradient-to-br from-emerald-500 to-teal-400",
    pattern: (
      <svg className="h-full w-full" aria-hidden="true">
        <defs>
          <pattern
            id="grid-pattern-3"
            width={30}
            height={30}
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M15 0L30 15L15 30L0 15Z"
              fill="none"
              stroke="white"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-pattern-3)" />
      </svg>
    ),
    accentColor: "text-emerald-600 hover:text-emerald-800",
  },
  {
    gradient: "bg-gradient-to-br from-indigo-600 to-blue-400",
    pattern: (
      <svg className="h-full w-full" aria-hidden="true">
        <defs>
          <pattern
            id="grid-pattern-4"
            width={40}
            height={40}
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M0 20H40M20 0V40"
              fill="none"
              stroke="white"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-pattern-4)" />
      </svg>
    ),
    accentColor: "text-indigo-600 hover:text-indigo-800",
  },
  {
    gradient: "bg-gradient-to-br from-rose-500 to-orange-400",
    pattern: (
      <svg className="h-full w-full" aria-hidden="true">
        <defs>
          <pattern
            id="grid-pattern-5"
            width={35}
            height={35}
            patternUnits="userSpaceOnUse"
          >
            <rect
              width="35"
              height="35"
              fill="none"
              stroke="white"
              strokeWidth="0.5"
            />
            <circle
              cx="17.5"
              cy="17.5"
              r="5"
              fill="none"
              stroke="white"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid-pattern-5)" />
      </svg>
    ),
    accentColor: "text-rose-600 hover:text-rose-800",
  },
];

const AuthForm = (props: AuthFormProps) => {
  const {
    handleEmailSubmit,
    handleGoogleSubmit,
    handleGithubSubmit,
    authFormType,
    customerPortalContent,
  } = props;

  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [selectedBackground, setSelectedBackground] = useState<BackgroundStyle>(
    backgroundStyles[0]
  );

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
    highlights: { text: string; color: string }[]
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
          </span>
        );
      }

      // Add the highlighted text with consistent slate-800 color
      result.push(
        <span key={`highlight-${index}`} className="text-slate-800">
          {highlight.text}
        </span>
      );

      lastIndex = index + highlight.text.length;
    }

    // Add any remaining text after the last highlight
    if (lastIndex < text.length) {
      result.push(
        <span key={`text-${lastIndex}`}>{text.substring(lastIndex)}</span>
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

      const randomBgIndex = Math.floor(Math.random() * backgroundStyles.length);
      setSelectedBackground(backgroundStyles[randomBgIndex]);

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
      router.push("https://us.helicone.ai/" + authFormType);
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
    <div className="w-full h-screen flex">
      {/* Left Panel - Branding and Visual Elements */}
      <div
        className={`hidden md:flex md:w-1/2 md:m-4 bg-gradient-to-br from-slate-100 to-sky-100 flex-col justify-between p-10 relative overflow-hidden md:rounded-3xl`}
      >
        <div className="relative z-20">
          <div className="flex justify-between items-center gap-4">
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

        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-10">
          {selectedBackground.pattern}
        </div>

        {/* Center Image - Only shown when showQuote is false */}
        {!showQuote && isContentLoaded && (
          <div className="absolute inset-0 z-10 transition-opacity duration-300">
            <Image
              src={selectedImage}
              alt="Helicone Featured Image"
              fill
              style={{ objectFit: "cover" }}
              className="w-full h-full"
              priority={true}
            />
          </div>
        )}

        {/* Quote - Only shown when showQuote is true */}
        {showQuote && isContentLoaded ? (
          <>
            <div className="relative z-20 space-y-3 w-full">
              <h1 className="text-4xl font-extrabold text-slate-300">&quot;</h1>
              <p className="text-slate-400 text-4xl font-medium w-full">
                {highlightText(selectedQuote.text, selectedQuote.highlights)}
              </p>
              <h1 className="text-4xl font-bold text-slate-300">&quot;</h1>
            </div>

            {/* Name and logo - Only shown with quote */}
            <div className="relative z-20 space-y-1 flex items-center gap-3">
              <Image
                src={selectedQuote.image}
                alt={selectedQuote.author}
                width={48}
                height={48}
                className="rounded-full"
              />
              <div>
                <p className="text-slate-500 text-md max-w-md">
                  {selectedQuote.author}
                </p>
                <p className="text-slate-400 text-sm max-w-md">
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
            <div className="relative z-20 space-y-1 flex items-center gap-3">
              <div>
                <p className="text-slate-500 text-md max-w-md">
                  Designed for the entire LLM lifecycle
                </p>
                <p className="text-slate-400 text-sm max-w-md">
                  The CI workflow to take your LLM application from MVP to
                  production.
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Right Panel - Auth Form */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-6 md:p-12 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="md:hidden flex justify-center mb-8">
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
                  className={selectedBackground.accentColor}
                >
                  Sign in here.
                </Link>
              </p>
            ) : (
              <p className="mt-2 text-sm text-gray-600">
                Don&apos;t have an account?{" "}
                <Link href={"/signup"} className={"text-sky-500"}>
                  Sign up here.
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
                <label htmlFor="terms" className="text-xs text-gray-600">
                  I accept the{" "}
                  <Link
                    href={"/terms"}
                    className={selectedBackground.accentColor}
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    href={"/privacy"}
                    className={selectedBackground.accentColor}
                  >
                    Privacy Policy
                  </Link>
                  .
                </label>
              </div>
            )}

            {authFormType === "signin" && (
              <div className="flex justify-end">
                <Link href={"/reset"} className={"text-sky-500 text-sm"}>
                  Forgot your password?
                </Link>
              </div>
            )}

            <Button
              type="submit"
              disabled={
                isLoading || (authFormType === "signup" && !acceptedTerms)
              }
              className="w-full py-2 text-white bg-sky-500"
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

          {(handleGoogleSubmit || handleGithubSubmit) && (
            <div className="mt-8">
              <div className="relative">
                <div
                  className="absolute inset-0 flex items-center"
                  aria-hidden="true"
                >
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-4 text-sm text-gray-500 bg-white">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                {handleGoogleSubmit && (
                  <button
                    onClick={() => handleGoogleSubmit()}
                    className="flex items-center justify-center gap-2 py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white hover:bg-gray-50 text-sm font-medium text-gray-700"
                  >
                    <BsGoogle />
                    <span>Google</span>
                  </button>
                )}
                {handleGithubSubmit && (
                  <button
                    onClick={() => handleGithubSubmit()}
                    className="flex items-center justify-center gap-2 py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white hover:bg-gray-50 text-sm font-medium text-gray-700"
                  >
                    <BsGithub />
                    <span>GitHub</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {customerPortalContent && (
            <div className="text-xs text-gray-500 text-center mt-8 italic">
              Powered by Helicone
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
