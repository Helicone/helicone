import Footer from "../components/layout/footer";
import NavBarV2 from "../components/layout/navbar/navBarV2";
import Link from "next/link";
import { useRouter } from "next/router";
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
  const router = useRouter();

  return (
    <PublicMetaData
      description={
        "How developers build AI applications. Get observability, tooling, fine-tuning, and evaluations out of the box. "
      }
      ogImageUrl={"https://www.helicone.ai/static/helicone-og.webp"}
    >
      <div className="w-full bg-gray-50 h-full antialiased">
        <NavBarV2 />
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
