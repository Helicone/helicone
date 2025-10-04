import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { GetServerSidePropsContext } from "next";
import Image from "next/image";
import React, { useState } from "react";
import Footer from "../../components/layout/footer";
import NavBarV2 from "../../components/layout/navbar/navBarV2";
import MetaData from "../../components/layout/public/authMetaData";
import useNotification from "../../components/shared/notification/useNotification";

export const COMPANY_SIZES = ["Just me", "2-5", "5-25", "25-100", "100+"];

const faqs = [
  {
    id: 1,
    question: "What is OpenPipe?",
    answer: (
      <>
        OpenPipe is a platform that helps you save money on OpenAI inference
        costs by fine-tuning your models. You can learn more about OpenPipe at{" "}
        <a href="https://openpipe.ai" className="text-blue-500">
          https://openpipe.ai
        </a>
        {"."}
      </>
    ),
  },
  {
    id: 2,
    question: "How much money has this saved?",
    answer:
      "We've saved our customers over $2 million so far since beta launching in September 2023.",
  },
  {
    id: 3,
    question: "How does this integration work?",
    answer:
      "You do not have to do anything! Helicone will send OpenPipe a random sample of 5,000 requests from your logs. OpenPipe will then fine-tune your model and send you back a new base url that you can use to make requests to your fine-tuned model.",
  },
  {
    id: 4,
    question: "How do I tell if the fine-tuned model is better?",
    answer:
      "OpenPipe will provide you with an evaluation dashboard that will show you the performance and allow you to experiment with comparisons to your original model.",
  },
  // More questions...
];

const OpenPipe = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const { setNotification } = useNotification();

  const handleBetaSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const orgName = formData.get("org-name") as string;
    const orgSize = formData.get("org-size") as string;

    if (orgSize === "Select company size") {
      setIsLoading(false);
      setNotification("Please select a company size.", "info");
      return;
    }

    fetch("/api/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        firstName: "",
        lastName: "",
        email: email,
        companyName: orgName,
        companyDescription: orgSize,
        tag: "openpipe",
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setNotification(
            "Error submitting form. Please try again later.",
            "error",
          );
        } else {
          const formElement = e.target as HTMLFormElement;
          formElement.reset();
          setIsLoading(false);
          setNotification(
            "Form submitted successfully! We'll be in touch soon.",
            "success",
          );
        }
      });
  };

  return (
    <MetaData title="Helicone - OpenPipe | The easiest way to fine-tune your models">
      <div className="w-full flex-col bg-white antialiased">
        <NavBarV2 />
        <div className="relative isolate">
          <svg
            className="absolute inset-0 -z-10 h-full w-full stroke-gray-200 [mask-image:radial-gradient(100%_60%_at_top_center,white,transparent)]"
            aria-hidden="true"
          >
            <defs>
              <pattern
                id="abc"
                width={25}
                height={25}
                x="50%"
                y={-1}
                patternUnits="userSpaceOnUse"
              >
                <path d="M25 200V.5M.5 .5H200" fill="none" />
              </pattern>
              <defs>
                <pattern
                  id="123"
                  width="12.5"
                  height="12.5"
                  patternUnits="userSpaceOnUse"
                >
                  <path d="M12.5 0V12.5M0 12.5H12.5" fill="none" />
                </pattern>
              </defs>
            </defs>
            <rect width="100%" height="100%" strokeWidth={0} fill="url(#abc)" />
          </svg>
          <div className="mx-auto flex max-w-5xl flex-col border-gray-300 px-6 pb-16 pt-10 sm:pb-24 lg:flex lg:px-8 lg:py-24">
            <section
              id="hero"
              className="flex w-full flex-col items-center space-y-8"
            >
              <div className="mb-16 flex flex-row items-center justify-center gap-4 sm:hidden">
                <Image
                  src="/assets/landing/helicone.webp"
                  alt="helicone"
                  width={150}
                  height={150}
                  className="rounded-md"
                />
                <div className="h-full w-0.5 bg-gray-500" />
                <Image
                  src="/assets/landing/openpipe.webp"
                  alt="openpipe"
                  width={150}
                  height={150}
                  className="rounded-md"
                />
              </div>
              <div className="hidden flex-row items-center justify-center gap-8 sm:flex">
                <Image
                  src="/assets/landing/helicone.webp"
                  alt="helicone"
                  width={200}
                  height={200}
                  className="rounded-md"
                />
                <div className="h-full w-0.5 bg-gray-500" />
                <Image
                  src="/assets/landing/openpipe.webp"
                  alt="openpipe"
                  width={200}
                  height={200}
                  className="rounded-md"
                />
              </div>
              <h1 className="text-center text-4xl font-semibold sm:pt-16 sm:text-5xl">
                Save up to{" "}
                <span className="border-dashed border-pink-700 text-pink-700 md:border-2 md:px-4 md:py-2">
                  95%
                </span>{" "}
                on your OpenAI costs
              </h1>
              <p className="text-center text-lg text-gray-600 sm:text-xl">
                Helicone is partnering with OpenPipe to provide fine-tuning
                services using Helicone logs
              </p>
            </section>
            <form
              onSubmit={handleBetaSignup}
              className="mx-auto mt-28 w-full max-w-xl space-y-8 rounded-lg border border-gray-300 bg-white p-8 shadow-lg"
            >
              <h2 className="text-2xl font-semibold text-gray-900">
                Sign up for our beta
              </h2>
              <div className="flex flex-col space-y-2">
                <label
                  htmlFor="email"
                  className="lg:text-md block text-sm font-medium leading-6 text-gray-900"
                >
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    // placeholder={mfsEmail !== null ? mfsEmail : ""}
                    className="lg:text-md block w-full rounded-md border-0 py-1.5 text-sm shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-600 lg:leading-6"
                  />
                </div>
              </div>
              <div className="flex flex-col space-y-2">
                <label
                  htmlFor="org-name"
                  className="lg:text-md block text-sm font-medium leading-6 text-gray-900"
                >
                  Organization Name
                </label>
                <div className="">
                  <input
                    type="text"
                    name="org-name"
                    id="org-name"
                    required
                    className="lg:text-md block w-full rounded-md border-0 py-1.5 text-sm shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-600 lg:leading-6"
                  />
                </div>
              </div>
              <div className="flex flex-col space-y-2 pb-4">
                <label
                  htmlFor="org-size"
                  className="lg:text-md block text-sm font-medium leading-6 text-gray-900"
                >
                  How large is your company?
                </label>
                <div className="">
                  <select
                    id="org-size"
                    name="org-size"
                    className="lg:text-md block w-full rounded-md border-0 py-1.5 text-sm shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-600 lg:leading-6"
                    required
                  >
                    {COMPANY_SIZES.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="mx-auto w-full rounded-md bg-pink-700 px-16 py-2 font-medium text-pink-50 hover:bg-pink-900"
              >
                {isLoading && (
                  <ArrowPathIcon className="mr-2 inline h-5 w-5 animate-spin" />
                )}
                {"Join Beta"}
              </button>
            </form>
            <section id="description" className="mt-32 flex flex-col space-y-8">
              <h2 className="text-2xl font-bold leading-10 tracking-tight text-gray-900">
                Questions and Answers
              </h2>
              <dl className="mt-10 space-y-8 divide-y divide-gray-900/10">
                {faqs.map((faq) => (
                  <div
                    key={faq.id}
                    className="pt-8 lg:grid lg:grid-cols-12 lg:gap-8"
                  >
                    <dt className="text-base font-semibold leading-7 text-gray-900 lg:col-span-5">
                      {faq.question}
                    </dt>
                    <dd className="mt-4 lg:col-span-7 lg:mt-0">
                      <p className="text-base leading-7 text-gray-600">
                        {faq.answer}
                      </p>
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          </div>
        </div>
        <Footer />
      </div>
    </MetaData>
  );
};

export default OpenPipe;

export const getServerSideProps = async (
  _context: GetServerSidePropsContext,
) => {
  // redirect the user to `/features/customer-portal`
  return {
    redirect: {
      destination: "/features/customer-portal",
      permanent: false,
    },
  };
};
