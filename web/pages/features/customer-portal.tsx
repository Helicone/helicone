import { CheckCircleIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import { useRouter } from "next/router";
import MetaData from "../../components/shared/metaData";
import NavBarV2 from "../../components/layout/navbar/navBarV2";
import GridBackground from "../../components/layout/public-pages/gridBackground";
import Link from "next/link";
import ContactForm from "../../components/shared/contactForm";
import Image from "next/image";
import Footer from "../../components/layout/footer";

const bullets = [
  "Billing / Usage APIs",
  "White labeling",
  "Embeddable dashboards",
  "Alerts",
  "Customer rate-limiting",
  "Customer facing API tokens",
  "Custom domains",
  "Custom proxy endpoint",
];

const CustomerPortal = () => {
  const router = useRouter();

  return (
    <MetaData title={"Contact Us"}>
      <NavBarV2 />
      <div className="bg-white h-full min-h-screen">
        <GridBackground>
          <div className="flex flex-col sm:flex-row mx-auto w-full gap-8 max-w-6xl p-4 md:px-8 pb-24 pt-10 sm:pb-32 lg:flex lg:py-24 antialiased">
            <div className="flex flex-col w-full">
              <h1 className="text-2xl sm:text-4xl font-semibold leading-tight sm:leading-snug max-w-4xl">
                Launch:{" "}
                <span className="md:border-2 border-sky-500 border-dashed text-sky-500 md:py-2 md:px-4">
                  Customer Portal
                </span>
                <p className="text-sm sm:text-lg font-normal text-gray-700 pt-4">
                  Easily share your Helicone dashboards and analytics with your
                  customers. All for only $799 per month.
                </p>
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
                "I am interested in Helicone's Customer Portal feature!"
              }
            />
          </div>
        </GridBackground>

        <div className="mx-auto max-w-6xl px-6 py-12 sm:py-18 flex flex-col space-y-4 md:space-y-8 items-center justify-center text-center lg:gap-x-10 lg:px-8 antialiased">
          <div className="flex flex-col">
            <div className="-m-2 rounded-xl bg-gray-900/5 p-2 ring-1 ring-inset ring-gray-900/10 lg:-m-2.5 lg:rounded-xl lg:p-2.5">
              <Image
                src="/assets/customer-portal/created-customer.png"
                alt="App screenshot"
                width={2720}
                height={1844}
                className="w-[70rem] rounded-lg shadow-2xl ring-1 ring-gray-900/10"
              />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </MetaData>
  );
};

export default CustomerPortal;
