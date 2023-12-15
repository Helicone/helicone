import Footer from "../components/shared/layout/footer";
import NavBarV2 from "../components/shared/layout/navbar/navBarV2";
import MetaData from "../components/shared/metaData";
import Link from "next/link";
import ContactForm from "../components/shared/contactForm";

const Sales = () => {
  return (
    <MetaData title={"Contact Us"}>
      <NavBarV2 />
      <div className="bg-gray-50 antialiased">
        <div className="flex flex-col mx-auto max-w-7xl p-4 md:px-8 pb-24 pt-10 sm:pb-32 lg:flex lg:py-24 antialiasing">
          <h1 className="mt-8 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl text-center">
            <span className="bg-gradient-to-r from-sky-500 via-pink-500 to-violet-500 bg-[length:100%_4px] pb-1 bg-no-repeat bg-bottom">
              Contact Us
            </span>
          </h1>
          <p className="mt-6 w-full text-xl leading-8 text-gray-700 text-center max-w-xl mx-auto">
            We would love to hear about your use case and how we can help you.
            Click{" "}
            <span>
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
            </span>
            to schedule a demo or fill out the form below and we will get back
            to you as soon as possible.
          </p>
          <div className="mt-16 flex w-full justify-center items-center">
            <ContactForm contactTag={"contact-us"} buttonText="Submit" />
          </div>
        </div>
      </div>
      <Footer />
    </MetaData>
  );
};

export default Sales;
