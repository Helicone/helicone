import Footer from "../components/shared/layout/footer";
import NavBarV2 from "../components/shared/layout/navbar/navBarV2";
import MetaData from "../components/shared/metaData";
import Link from "next/link";
import ContactForm from "../components/shared/contactForm";
import { useRouter } from "next/router";
import Image from "next/image";

const Sales = () => {
  const router = useRouter();

  const isCustomerPortal = router.query["customer-portal"] === "true";

  return (
    <MetaData title={"Contact Us"}>
      <NavBarV2 />
      <div className="bg-gray-50 antialiased">
        <div className="flex flex-col mx-auto max-w-7xl p-4 md:px-8 pb-24 pt-10 sm:pb-32 lg:flex lg:py-24 antialiasing">
          <h1 className="mt-8 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl text-center">
            <span className="bg-gradient-to-r from-sky-500 via-pink-500 to-violet-500 bg-[length:100%_4px] pb-1 bg-no-repeat bg-bottom">
              {isCustomerPortal ? "Helicone's Customer Portal" : "Contact Us"}
            </span>
          </h1>
          {isCustomerPortal ? (
            <>
              <p className="mt-6 w-full text-xl leading-8 text-gray-700 text-left max-w-xl mx-auto">
                Share your Helicone dashboards easily with your customers
                <ul className="list-disc list-inside text-base mt-5 ml-5">
                  <li>Billing/Usage APIs</li>
                  <li>White labeling</li>
                  <li>Embeddable dashboards</li>
                  <li>Alerts</li>
                  <li>Customer ratelimiting</li>
                  <li>Customer facing API tokens</li>
                  <li>Custom domains</li>
                </ul>
              </p>
              <p className="mt-6 w-full text-xl leading-8 text-gray-700 text-left max-w-xl mx-auto">
                <Image
                  src="/assets/customer-portal/created-customer.png"
                  alt="Customer Portal"
                  width={600}
                  height={400}
                  layout="responsive"
                />
              </p>
              <p className="mt-6 w-full text-xl leading-8 text-gray-700 text-center ">
                <Link
                  href={"https://docs.helicone.ai/features/customer-portal"}
                  className=" mx-auto justify-center rounded-md border border-transparent bg-gradient-to-r from-sky-600 to-indigo-500  py-2 px-4 text-md font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  🚀 Customer Portal Docs 🚀
                </Link>
              </p>
              <p className="mt-6 w-full text-xl leading-8 text-gray-700 text-center max-w-xl mx-auto">
                <b>To get access:</b> meet{" "}
                <Link
                  href={
                    "https://calendly.com/d/x5d-9q9-v7x/helicone-discovery-call"
                  }
                  className="text-blue-500 hover:text-blue-600 underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  via Calendly
                </Link>{" "}
                or complete the form below.
              </p>
            </>
          ) : (
            <p className="mt-6 w-full text-xl leading-8 text-gray-700 text-center max-w-xl mx-auto">
              We would love to hear about your use case and how we can help you.
              Click{" "}
              <Link
                href={
                  "https://calendly.com/d/x5d-9q9-v7x/helicone-discovery-call"
                }
                className="text-blue-500 hover:text-blue-600 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                here
              </Link>{" "}
              to schedule a demo or fill out the form below and we will get back
              to you as soon as possible.
            </p>
          )}
          <div className="mt-16 flex w-full justify-center items-center">
            <ContactForm
              contactTag={isCustomerPortal ? "customer-portal" : "contact-us"}
              buttonText="Submit"
              defaultText={
                isCustomerPortal
                  ? "I am interested in Helicone's Customer Portal feature!"
                  : ""
              }
            />
          </div>
        </div>
      </div>
      <Footer />
    </MetaData>
  );
};

export default Sales;
