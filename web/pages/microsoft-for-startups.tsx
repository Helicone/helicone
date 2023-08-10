import { CheckCircleIcon } from "@heroicons/react/20/solid";
import Footer from "../components/shared/layout/footer";
import NavBarV2 from "../components/shared/layout/navbar/navBarV2";
import MetaData from "../components/shared/metaData";
import { clsx } from "../components/shared/clsx";
import Image from "next/image";
import { useState } from "react";

const featureMap = [
  {
    name: "Unlimited Requests",
    description:
      "Deploy to production and test internally without worrying about limits.",
  },
  {
    name: "Request Segmentation",
    description:
      "Segment requests by user, organization, or any other custom property.",
  },
  {
    name: "Bucket Caching",
    description:
      "Easily cache your common requests to save money and improve performance.",
  },
  {
    name: "User Rate Limiting",
    description:
      "Limit the number of requests a user can make in a given time period.",
  },
  {
    name: "GraphQL API",
    description: "Query your data and integrate with your favorite tools.",
  },
  {
    name: "Request Retries",
    description:
      "Retry failed requests automatically to improve your users' UX.",
  },
  {
    name: "Unlimited Organizations",
    description:
      "Create as many organizations as you need to manage your projects.",
  },
];

const MicrosoftForStartups = () => {
  const [isLoading, setIsLoading] = useState(false);

  const formSubmitHandler = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    const firstName = event.currentTarget.elements.namedItem(
      "first-name"
    ) as HTMLInputElement;
    const lastName = event.currentTarget.elements.namedItem(
      "last-name"
    ) as HTMLInputElement;
    const email = event.currentTarget.elements.namedItem(
      "email"
    ) as HTMLInputElement;
    const companyName = event.currentTarget.elements.namedItem(
      "company-name"
    ) as HTMLInputElement;
    const companyDescription = event.currentTarget.elements.namedItem(
      "company-description"
    ) as HTMLInputElement;

    console.log("called");
    // TODO: create a new supabase table for this

    setIsLoading(false);
  };

  return (
    <MetaData title={"Microsoft For Startups"}>
      <NavBarV2 />
      <div className="bg-gray-50 antialiased">
        <div className="flex flex-col mx-auto max-w-7xl p-4 md:px-8 pb-24 pt-10 sm:pb-32 lg:flex lg:py-24 antialiasing">
          <div className="flex flex-row items-center gap-6 divide-x divide-gray-300 divide-dashed">
            <Image
              className="rounded-lg"
              priority
              src={"/assets/landing/helicone-mobile.webp"}
              alt={"Helicone-mobile"}
              width={60}
              height={60}
            />
            <div>
              <Image
                priority
                src={"/assets/mfs.png"}
                alt={"Helicone-mobile"}
                width={250}
                height={250}
              />
            </div>
          </div>
          <h1 className="mt-8 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Microsoft for{" "}
            <span className="bg-gradient-to-r from-sky-500 via-pink-500 to-violet-500 bg-[length:100%_4px] pb-1 bg-no-repeat bg-bottom">
              Startups
            </span>
          </h1>
          <p className="mt-6 w-full text-xl leading-8 text-gray-700">
            With only two lines of code, Founders Hub members get a full year of
            Helicone Pro for free ($300 value).
          </p>
          <div className="mt-16 flow-root">
            <div className="isolate -mt-16 grid max-w-sm grid-cols-1 gap-y-16 divide-y divide-gray-300 divide-dashed sm:mx-auto lg:-mx-8 lg:mt-0 lg:max-w-none lg:grid-cols-2 lg:divide-x lg:divide-y-0 xl:-mx-14">
              <div className="pt-16 lg:px-8 lg:pt-0 xl:px-14">
                <h3 className="text-lg font-semibold text-gray-900">
                  Below are features our Pro users love:
                </h3>

                <ul
                  role="list"
                  className="mt-8 space-y-6 text-md leading-6 text-gray-600"
                >
                  {featureMap.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <CheckCircleIcon
                        className="h-4 w-4 flex-none text-violet-500 mt-1"
                        aria-hidden="true"
                      />
                      <p className="pl-1.5">
                        <span className="underline font-semibold text-gray-900">
                          {feature.name}
                        </span>
                        :
                        <span className="pl-1 text-gray-700">
                          {feature.description}
                        </span>
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="pt-16 lg:px-8 lg:pt-0 xl:px-14">
                <form className="border border-gray-300 bg-gray-200 shadow-xl rounded-xl p-8 h-full space-y-4">
                  <div>
                    <label
                      htmlFor="first-name"
                      className="block text-sm lg:text-md font-medium leading-6 text-gray-900"
                    >
                      First Name
                    </label>
                    <div className="mt-1">
                      <input
                        id="first-name"
                        name="first-name"
                        type="text"
                        required
                        className="block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-600 text-sm lg:text-md lg:leading-6"
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="last-name"
                      className="block text-sm lg:text-md font-medium leading-6 text-gray-900"
                    >
                      Last Name
                    </label>
                    <div className="mt-1">
                      <input
                        id="last-name"
                        name="last-name"
                        type="text"
                        required
                        className="block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-600 text-sm lg:text-md lg:leading-6"
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm lg:text-md font-medium leading-6 text-gray-900"
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
                        className="block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-600 text-sm lg:text-md lg:leading-6"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Ensure this email belongs to the organization
                        you&apos;re requesting Pro for.
                      </p>
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="company-name"
                      className="block text-sm lg:text-md font-medium leading-6 text-gray-900"
                    >
                      Company Name
                    </label>
                    <div className="mt-1">
                      <input
                        id="company-name"
                        name="company-name"
                        type="text"
                        required
                        className="block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-600 text-sm lg:text-md lg:leading-6"
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="company-description"
                      className="block text-sm lg:text-md font-medium leading-6 text-gray-900"
                    >
                      What does your company do and how you plan to use
                      Helicone.
                    </label>
                    <div className="mt-1">
                      <textarea
                        id="company-description"
                        name="company-description"
                        required
                        rows={4}
                        className="block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-600 text-sm lg:text-md lg:leading-6"
                      />
                    </div>
                  </div>
                  <div className="border-t border-gray-300 flex justify-end gap-2 pt-4">
                    <button
                      type="submit"
                      className="items-center rounded-md bg-black px-4 py-2 text-sm flex font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    >
                      Claim Free Year
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </MetaData>
  );
};

export default MicrosoftForStartups;
