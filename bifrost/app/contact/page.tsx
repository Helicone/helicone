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
    <div className="w-full h-full antialiased text-black">
      <div className="h-full">
        <div className="flex flex-col mx-auto w-full gap-8 max-w-5xl p-4 md:px-8 pb-24 pt-10 sm:pb-32 lg:flex lg:py-24 antialiased">
          <div className="flex flex-col w-2/3">
            <h1 className="text-2xl sm:text-4xl font-semibold leading-tight sm:leading-snug max-w-4xl">
              Contact Us
            </h1>

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
              Want to chat with the founders?
            </p>
            <Link
              href={"https://cal.com/team/helicone/helicone-discovery"}
              className="text-gray-500 hover:text-black flex flex-row items-center gap-1 text-sm mt-2 w-fit"
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
