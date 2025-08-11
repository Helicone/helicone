import { CheckCircleIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import MetaData from "../../components/layout/public/authMetaData";
import NavBarV2 from "../../components/layout/navbar/navBarV2";
import GridBackground from "../../components/layout/public/gridBackground";
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
  return (
    <MetaData title={"Contact Us"}>
      <NavBarV2 />
      <div className="h-full min-h-screen bg-white">
        <GridBackground>
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-4 pb-24 pt-10 antialiased sm:flex-row sm:pb-32 md:px-8 lg:flex lg:py-24">
            <div className="flex w-full flex-col">
              <h1 className="max-w-4xl text-2xl font-semibold leading-tight sm:text-4xl sm:leading-snug">
                Launch:{" "}
                <span className="border-dashed border-sky-500 text-sky-500 md:border-2 md:px-4 md:py-2">
                  Customer Portal
                </span>
                <p className="pt-4 text-sm font-normal text-gray-700 sm:text-lg">
                  Easily share your Helicone dashboards and analytics with your
                  customers. All for only $799 per month.
                </p>
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
            <ContactForm
              contactTag={"customer-portal"}
              buttonText={"Contact Us"}
              defaultPlaceholder={
                "I am interested in Helicone's Customer Portal feature!"
              }
            />
          </div>
        </GridBackground>

        <div className="sm:py-18 mx-auto flex max-w-6xl flex-col items-center justify-center space-y-4 px-6 py-12 text-center antialiased md:space-y-8 lg:gap-x-10 lg:px-8">
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
