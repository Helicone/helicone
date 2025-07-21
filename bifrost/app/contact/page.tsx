import Link from "next/link";
import { CheckCircleIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import Calendar from "@/components/templates/contact/calendar";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us | Helicone",
  description:
    "Get in touch for product demos, pricing information, onboarding support and inquiries about our platform and enterprise solutions.",
  icons: "https://www.helicone.ai/static/logo.webp",
  openGraph: {
    type: "website",
    siteName: "Helicone.ai",
    url: "https://www.helicone.ai/contact",
    title: "Contact Us | Helicone",
    description:
      "Get in touch for product demos, pricing information, onboarding support and inquiries about our platform and enterprise solutions.",
    images: "/static/new-open-graph.png",
    locale: "en_US",
  },
  twitter: {
    title: "Contact Us | Helicone",
    description:
      "Get in touch for product demos, pricing information, onboarding support and inquiries about our platform and enterprise solutions.",
    card: "summary_large_image",
    images: "/static/new-open-graph.png",
  },
};

const bullets = [
  "Request a demo",
  "Learn more about our product",
  "Learn about our pricing, features, and integrations",
  "Request a SOC-2 report or our on-premise solution",
  "Get onboarding support",
];

const Contact = () => {
  return (
    <div className="h-full w-full text-black antialiased">
      <div className="h-full">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 p-4 pb-24 pt-10 antialiased sm:pb-32 md:px-8 lg:flex lg:py-24">
          <div className="flex w-2/3 flex-col">
            <h1 className="max-w-4xl text-2xl font-semibold leading-tight sm:text-4xl sm:leading-snug">
              Contact Us
            </h1>

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
              Want to chat with the founders?
            </p>
            <Link
              href={"https://cal.com/team/helicone/helicone-discovery"}
              className="mt-2 flex w-fit flex-row items-center gap-1 text-sm text-gray-500 hover:text-black"
              target="_blank"
              rel="noopener noreferrer"
            >
              Contact Us <ChevronRightIcon className="h-4 w-4" />
            </Link>
          </div>
          <Calendar />
        </div>
      </div>
    </div>
  );
};

export default Contact;
