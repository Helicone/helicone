import Footer from "../components/layout/footer";
import NavBarV2 from "../components/layout/navbar/navBarV2";
import Link from "next/link";
import { CheckCircleIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import PublicMetaData from "../components/layout/public/publicMetaData";

const bullets = [
  "Request a demo",
  "Learn more about our product",
  "Learn about our pricing, features, and integrations",
  "Request a SOC-2 report or our on-premise solution",
  "Get onboarding support",
];

const Contact = () => {
  return (
    <PublicMetaData
      description={
        "How developers build AI applications. Get observability, tooling, fine-tuning, and evaluations out of the box. "
      }
      ogImageUrl={"https://www.helicone.ai/static/helicone-og.webp"}
    >
      <div className="h-full w-full bg-gray-50 antialiased">
        <NavBarV2 />
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
        <Footer />
      </div>
    </PublicMetaData>
  );
};

export default Contact;

import Cal, { getCalApi } from "@calcom/embed-react";
import { useEffect } from "react";
function Calendar() {
  useEffect(() => {
    (async function () {
      const cal = await getCalApi();
      cal("ui", {
        theme: "light",
        styles: { branding: { brandColor: "#000000" } },
        hideEventTypeDetails: false,
        layout: "month_view",
      });
    })();
  }, []);
  return (
    <Cal
      calLink="team/helicone/helicone-discovery"
      style={{ width: "100%", height: "100%", overflow: "scroll" }}
      config={{ layout: "month_view" }}
    />
  );
}
