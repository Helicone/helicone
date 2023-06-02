import { CheckIcon } from "@heroicons/react/24/outline";
import OnboardingButton from "../../shared/auth/onboardingButton";
import BasePageV2 from "../../shared/layout/basePageV2";

interface PricingPageProps {}

const includedFeatures = [
  "Aggregated Metrics",
  "User Metrics",
  "Caching",
  "User Rate Limiting",
  "Streaming Support",
  "Custom Property Support",
];

const PricingPage = (props: PricingPageProps) => {
  const {} = props;

  return (
    <BasePageV2>
      <div className="bg-gray-50">
        <div className="mx-auto max-w-7xl py-16 sm:py-24 px-6 lg:px-8  border-r border-l border-gray-300 border-dashed">
          <div className="mx-auto max-w-2xl sm:text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Free to start, easy to scale
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Pricing plans don&apos;t have to be complicated. We built our
              pricing plan to be simple and straightforward, so you can get
              started easily and scale with us.
            </p>
          </div>
          {/* Basic Flex */}
          <div className="mx-auto mt-16 max-w-2xl rounded-3xl ring-1 ring-gray-200 sm:mt-20 lg:mx-0 lg:flex lg:max-w-none">
            <div className="p-8 sm:p-10 lg:flex-auto">
              <h3 className="text-2xl font-semibold text-gray-900">
                Basic Flex
              </h3>
              <p className="mt-6 text-base leading-7 text-gray-600">
                Basic Flex offers 100k free requests monthly, with a
                pay-as-you-grow model. For every additional 10k requests after
                the free tier, pay just $1.00. A budget-friendly and scalable
                solution for users who value flexibility and cost-efficiency.
              </p>
              <div className="mt-10 flex items-center gap-x-4">
                <h4 className="flex-none text-sm font-semibold leading-6 text-sky-600">
                  What’s included
                </h4>
                <div className="h-px flex-auto bg-gray-200" />
              </div>
              <ul
                role="list"
                className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm leading-6 text-gray-600 lg:grid-cols-3 sm:gap-4"
              >
                {includedFeatures.map((feature) => (
                  <li key={feature} className="flex gap-x-3">
                    <CheckIcon
                      className="h-6 w-5 flex-none text-sky-600"
                      aria-hidden="true"
                    />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
            <div className="-mt-2 p-4 lg:mt-0 lg:w-full lg:max-w-md lg:flex-shrink-0">
              <div className="rounded-2xl h-full bg-gray-200 py-10 text-center ring-1 ring-inset ring-gray-900/5 lg:flex lg:flex-col lg:justify-center lg:py-16">
                <div className="mx-auto max-w-xs px-8 space-y-8">
                  <p className="text-md font-semibold text-gray-600">
                    Your first 100k requests each month are free
                  </p>
                  <p className="flex items-baseline justify-center gap-x-2">
                    <span className="text-5xl font-bold tracking-tight text-gray-900">
                      $1.00
                    </span>
                    <span className="text-sm font-semibold leading-6 tracking-wide text-gray-600">
                      per 10k requests
                    </span>
                  </p>
                  <OnboardingButton
                    variant="secondary"
                    title={"Get Started"}
                    full
                  />
                </div>
              </div>
            </div>
          </div>
          {/* Enterprise */}
          <div className="relative mx-auto mt-8 w-full lg:mt-16">
            <div className="mx-auto">
              <div className="rounded-3xl bg-gray-300 px-6 py-8 sm:p-10 lg:flex lg:items-center">
                <div className="flex-1">
                  <h3 className="text-2xl font-semibold text-gray-900">
                    Enterprise
                  </h3>
                  <div className="mt-4 text-base leading-7 text-gray-600">
                    Enterprise is designed for large organizations, offering
                    custom request limits, advanced features, and 24/7 expert
                    support. Experience enhanced security and priority access to
                    new features for mission-critical operations.
                  </div>
                </div>
                <div className="mt-6 rounded-md shadow lg:ml-10 lg:mt-0 lg:flex-shrink-0">
                  <a
                    href="#"
                    className="flex items-center justify-center rounded-md border border-transparent bg-white px-5 py-3 text-md font-semibold text-gray-900 hover:bg-gray-50"
                  >
                    Contact Sales
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BasePageV2>
  );
};

export default PricingPage;
