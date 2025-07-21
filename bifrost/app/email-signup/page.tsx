import { Metadata } from "next";
import { CheckCircleIcon } from "@heroicons/react/20/solid";
import EmailSignUpForm from "./EmailSignUpForm";

export const metadata: Metadata = {
  title: "Subscribe to Helicone | Helicone",
  description:
    "Subscribe to get exclusive access to our observability playbooks, benchmark data from production LLM deployments, and early access to our query tracing tools.",
  icons: "https://www.helicone.ai/static/logo.webp",
  openGraph: {
    type: "website",
    siteName: "Helicone.ai",
    url: "https://www.helicone.ai/email-signup",
    title: "Subscribe to Helicone | Helicone",
    description:
      "Subscribe to get exclusive access to our observability playbooks, benchmark data from production LLM deployments, and early access to our query tracing tools.",
    images: "/static/new-open-graph.png",
    locale: "en_US",
  },
  twitter: {
    title: "Subscribe to Helicone | Helicone",
    description:
      "Subscribe to get exclusive access to our observability playbooks, benchmark data from production LLM deployments, and early access to our query tracing tools.",
    card: "summary_large_image",
    images: "/static/new-open-graph.png",
  },
};

const bullets: string[] = [
  "Exclusive access to our LLM observability playbooks",
  "Benchmark data from production LLM deployments",
  "Early access to our launch features and updates",
];

const EmailSignup = () => {
  return (
    <div className="h-full w-full text-black antialiased">
      <div className="h-full">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 p-4 pb-24 pt-10 antialiased sm:pb-32 md:px-8 lg:flex lg:py-24">
          <div className="flex w-2/3 flex-col">
            <h1 className="max-w-4xl text-2xl font-semibold leading-tight sm:text-4xl sm:leading-snug">
              Subscribe to Helicone 💌
            </h1>
            <br />
            <p className="text-sm text-gray-700">
              The difference between good and great AI engineers? Visibility
              into what&apos;s actually happening.
            </p>

            <ul className="flex flex-col space-y-4 py-8">
              {bullets.map((bullet, idx) => (
                <li
                  className="sm:text-md flex items-center gap-2 text-sm text-gray-700"
                  key={idx}
                >
                  <CheckCircleIcon className="h-4 w-4 text-sky-500 sm:h-5 sm:w-5" />
                  {bullet}
                </li>
              ))}
            </ul>

            <p className="mt-4 text-sm text-black">
              Building better AI systems starts with better insights.
            </p>
            <br />

            <EmailSignUpForm />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailSignup;
