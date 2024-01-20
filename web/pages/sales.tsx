import Footer from "../components/layout/footer";
import NavBarV2 from "../components/layout/navbar/navBarV2";
import MetaData from "../components/shared/metaData";
import Link from "next/link";
import ContactForm from "../components/shared/contactForm";
import { useRouter } from "next/router";
import GridBackground from "../components/layout/public-pages/gridBackground";
import { CheckCircleIcon, ChevronRightIcon } from "@heroicons/react/20/solid";

const bullets = [
  "Billing/Usage APIs",
  "White labeling",
  "Embeddable dashboards",
  "Alerts",
  "Customer ratelimiting",
  "Customer facing API tokens",
  "Custom domains",
  "Custom Proxy Endpoint",
];

const Sales = () => {
  const router = useRouter();

  return (
    <MetaData title={"Contact Us"}>
      <NavBarV2 />
      <div className="bg-white h-full min-h-screen">
        <GridBackground>
          <div className="flex flex-col sm:flex-row mx-auto w-full gap-8 max-w-6xl p-4 md:px-8 pb-24 pt-10 sm:pb-32 lg:flex lg:py-24 antialiased">
            <div className="flex flex-col w-full">
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
                href={
                  "https://calendly.com/d/x5d-9q9-v7x/helicone-discovery-call"
                }
                className="text-gray-500 hover:text-black flex flex-row items-center gap-1 text-sm mt-2 w-fit"
                target="_blank"
                rel="noopener noreferrer"
              >
                Contact Us <ChevronRightIcon className="h-4 w-4" />
              </Link>
            </div>
            <ContactForm
              contactTag={""}
              buttonText={"Contact Us"}
              defaultPlaceholder={
                "I am interested in using Helicone for my business..."
              }
            />
          </div>
        </GridBackground>
      </div>
      <Footer />
    </MetaData>
  );
};

export default Sales;
