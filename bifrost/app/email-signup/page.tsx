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
    <div className="w-full h-full antialiased text-black">
      <div className="h-full">
        <div className="flex flex-col mx-auto w-full gap-8 max-w-5xl p-4 md:px-8 pb-24 pt-10 sm:pb-32 lg:flex lg:py-24 antialiased">
          <div className="flex flex-col w-2/3">
            <h1 className="text-2xl sm:text-4xl font-semibold leading-tight sm:leading-snug max-w-4xl">
              Subscribe to Helicone 💌
            </h1>
            <br />
            <p className="text-gray-700 text-sm">
              The difference between good and great AI engineers? Visibility
              into what&apos;s actually happening.
            </p>

            <ul className="py-8 flex flex-col space-y-4">
              {bullets.map((bullet, idx) => (
                <li
                  className="flex items-center text-gray-700 gap-2 text-sm sm:text-md"
                  key={idx}
                >
                  <CheckCircleIcon className="h-4 w-4 sm:h-5 sm:w-5 text-sky-500" />
                  {bullet}
                </li>
              ))}
            </ul>

            <p className="text-black text-sm mt-4">
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
