import { clsx } from "../../shared/clsx";
import {
  BuildingOffice2Icon,
  BuildingOfficeIcon,
  BuildingStorefrontIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/solid";

const tiers: {
  name: string;
  id: string;
  icon: React.ForwardRefExoticComponent<
    React.SVGProps<SVGSVGElement> & {
      title?: string | undefined;
      titleId?: string | undefined;
    }
  >;
  featured: boolean;
  description: string;
  mainFeatures: string[];
}[] = [
  {
    name: "Free",
    icon: BuildingStorefrontIcon,
    id: "tier-free",
    featured: false,
    description: "Everything you need to get your startup off the ground.",
    mainFeatures: [
      "Up to 100k request logs",
      "Dashboards and Analytics",
      "Access to prompt templates",
      "Caching and other tooling",
    ],
  },
  {
    name: "Growth",
    id: "tier-growth",
    icon: BuildingOfficeIcon,
    featured: true,
    description: "Pay as you go. Perfect for businesses of all sizes.",
    mainFeatures: [
      "Unlimited request logs (pay as you go)",
      "Access to prompt templates",
      "Access to prompt experiments",
      "Priority support",
      "Lower rate limits on all features",
      "Access to Helicone API",
    ],
  },
  {
    name: "Enterprise",
    id: "tier-enterprise",
    icon: BuildingOffice2Icon,
    featured: false,
    description: "The best solution for large companies with complex needs.",
    mainFeatures: [
      "Bulk Request Log Pricing",
      "SOC-2 Compliance",
      "On-Prem Deployments",
      "Custom ETL integrations",
      "Customer Portal",
      "Custom SLAs",
    ],
  },
];
const sections: {
  name: string;
  features: {
    name: string;
    tiers: Record<string, string | boolean>;
  }[];
}[] = [
  {
    name: "Core Features",
    features: [
      {
        name: "Request Logs",
        tiers: {
          Free: "Up to 100k Free",
          Growth: "Pay as you go",
          Enterprise: "Unlimited",
        },
      },
      {
        name: "Dashboards and Analytics",
        tiers: { Free: true, Growth: true, Enterprise: true },
      },
      {
        name: "User Analytics",
        tiers: { Free: true, Growth: true, Enterprise: true },
      },
      {
        name: "Cost Tracking",
        tiers: {
          Free: true,
          Growth: true,
          Enterprise: true,
        },
      },
      {
        name: "Labeling and Tagging",
        tiers: { Free: true, Growth: true, Enterprise: true },
      },
      {
        name: "Prompt Templates",
        tiers: {
          Free: "3 free",
          Growth: "Pay as you go",
          Enterprise: "unlimited",
        },
      },
      {
        name: "Prompt Experiments & Testing",
        tiers: {
          Free: false,
          Growth: "Pay as you go",
          Enterprise: "unlimited",
        },
      },
      {
        name: "Organization Members",
        tiers: {
          Free: "unlimited",
          Growth: "unlimited",
          Enterprise: "unlimited",
        },
      },
      {
        name: "SOC-2 Compliance",
        tiers: { Free: false, Growth: false, Enterprise: true },
      },
      {
        name: "On-Prem Deployments",
        tiers: { Free: false, Growth: false, Enterprise: true },
      },
    ],
  },
  {
    name: "Tooling",
    features: [
      {
        name: "Caching",
        tiers: { Free: true, Growth: true, Enterprise: true },
      },
      {
        name: "User Rate Limiting",
        tiers: { Free: true, Growth: true, Enterprise: true },
      },
      {
        name: "Smart Request Retries",
        tiers: { Free: true, Growth: true, Enterprise: true },
      },
      {
        name: "REST API",
        tiers: { Free: true, Growth: true, Enterprise: true },
      },
      {
        name: "Key Vault",
        tiers: { Free: false, Growth: true, Enterprise: true },
      },
      {
        name: "Fine-Tuning",
        tiers: { Free: false, Growth: "Limited", Enterprise: "Unlimited" },
      },
      {
        name: "Customer Portal",
        tiers: { Free: false, Growth: false, Enterprise: true },
      },

      {
        name: "Custom ETL Integrations",
        tiers: { Free: false, Growth: false, Enterprise: true },
      },
    ],
  },
];

export default function FeatureTable() {
  return (
    <div className="isolate overflow-hidden">
      <div className="relative">
        <div className="mx-auto max-w-6xl px-4 pb-8 lg:px-4">
          {/* Feature comparison (up to lg) */}
          <section
            aria-labelledby="mobile-comparison-heading"
            className="lg:hidden"
          >
            <h2 id="mobile-comparison-heading" className="sr-only">
              Feature comparison
            </h2>

            <div className="mx-auto max-w-2xl space-y-16">
              {tiers.map((tier) => (
                <div key={tier.id} className="border-t border-gray-900/10">
                  <div
                    className={clsx(
                      tier.featured ? "border-sky-500" : "border-transparent",
                      "-mt-px w-72 border-t-2 pt-10 md:w-80"
                    )}
                  >
                    <div className="flex items-center space-x-1">
                      <tier.icon
                        className={clsx(
                          tier.featured ? "text-sky-500" : "text-gray-900",
                          "w-4 h-4"
                        )}
                      />
                      <p
                        className={clsx(
                          tier.featured ? "text-sky-500" : "text-gray-900",
                          "text-sm font-semibold leading-6"
                        )}
                      >
                        {tier.name}
                      </p>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-gray-500">
                      {tier.description}
                    </p>
                  </div>

                  <div className="mt-10 space-y-10">
                    {sections.map((section) => (
                      <div key={section.name}>
                        <h4 className="text-sm font-semibold leading-6 text-gray-900">
                          {section.name}
                        </h4>
                        <div className="relative mt-6">
                          {/* Fake card background */}
                          <div
                            aria-hidden="true"
                            className="absolute inset-y-0 right-0 hidden w-1/2 rounded-lg bg-sky-50 shadow-sm sm:block"
                          />

                          <div
                            className={clsx(
                              tier.featured
                                ? "ring-2 ring-sky-500"
                                : "ring-1 ring-gray-900/10",
                              "relative rounded-lg bg-sky-50 shadow-sm sm:rounded-none sm:bg-transparent sm:shadow-none sm:ring-0"
                            )}
                          >
                            <dl className="divide-y divide-gray-200 text-sm leading-6">
                              {section.features.map((feature) => (
                                <div
                                  key={feature.name}
                                  className="flex items-center justify-between px-4 py-3 sm:grid sm:grid-cols-2 sm:px-0"
                                >
                                  <dt className="pr-4 text-gray-500">
                                    {feature.name}
                                  </dt>
                                  <dd className="flex items-center justify-end sm:justify-center sm:px-4">
                                    {typeof feature.tiers[tier.name] ===
                                    "string" ? (
                                      <span
                                        className={
                                          tier.featured
                                            ? "font-semibold text-sky-500"
                                            : "text-gray-900"
                                        }
                                      >
                                        {feature.tiers[tier.name]}
                                      </span>
                                    ) : (
                                      <>
                                        {feature.tiers[tier.name] === true ? (
                                          <CheckCircleIcon
                                            className="mx-auto h-4 w-4 text-sky-500"
                                            aria-hidden="true"
                                          />
                                        ) : (
                                          <XCircleIcon
                                            className="mx-auto h-4 w-4 text-gray-400"
                                            aria-hidden="true"
                                          />
                                        )}

                                        <span className="sr-only">
                                          {feature.tiers[tier.name] === true
                                            ? "Yes"
                                            : "No"}
                                        </span>
                                      </>
                                    )}
                                  </dd>
                                </div>
                              ))}
                            </dl>
                          </div>

                          {/* Fake card border */}
                          <div
                            aria-hidden="true"
                            className={clsx(
                              tier.featured
                                ? "ring-2 ring-sky-500"
                                : "ring-1 ring-gray-900/10",
                              "pointer-events-none absolute inset-y-0 right-0 hidden w-1/2 rounded-lg sm:block"
                            )}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Feature comparison (lg+) */}
          <section
            aria-labelledby="comparison-heading"
            className="hidden lg:block"
          >
            <h2 id="comparison-heading" className="sr-only">
              Feature comparison
            </h2>

            <div className="grid grid-cols-4 gap-x-8 border-t border-gray-900/10 before:block">
              {tiers.map((tier) => (
                <div key={tier.id} aria-hidden="true" className="-mt-px">
                  <div
                    className={clsx(
                      tier.featured ? "border-sky-500" : "border-transparent",
                      "border-t-2 pt-10"
                    )}
                  >
                    <div className="flex items-center space-x-1">
                      <tier.icon
                        className={clsx(
                          tier.featured ? "text-sky-500" : "text-gray-900",
                          "w-4 h-4"
                        )}
                      />
                      <p
                        className={clsx(
                          tier.featured ? "text-sky-500" : "text-gray-900",
                          "text-sm font-semibold leading-6"
                        )}
                      >
                        {tier.name}
                      </p>
                    </div>

                    <p className="mt-1 text-sm leading-6 text-gray-500">
                      {tier.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="-mt-6 space-y-16">
              {sections.map((section) => (
                <div key={section.name}>
                  <h3 className="text-sm font-semibold leading-6 text-gray-900">
                    {section.name}
                  </h3>
                  <div className="relative -mx-8 mt-10">
                    {/* Fake card backgrounds */}
                    <div
                      className="absolute inset-x-8 inset-y-0 grid grid-cols-4 gap-x-8 before:block"
                      aria-hidden="true"
                    >
                      <div className="h-full w-full rounded-lg bg-sky-50 shadow-sm" />
                      <div className="h-full w-full rounded-lg bg-sky-50 shadow-sm" />
                      <div className="h-full w-full rounded-lg bg-sky-50 shadow-sm" />
                    </div>

                    <table className="relative w-full border-separate border-spacing-x-8">
                      <thead>
                        <tr className="text-left">
                          <th scope="col">
                            <span className="sr-only">Feature</span>
                          </th>
                          {tiers.map((tier) => (
                            <th key={tier.id} scope="col">
                              <span className="sr-only">{tier.name} tier</span>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {section.features.map((feature, featureIdx) => (
                          <tr key={feature.name}>
                            <th
                              scope="row"
                              className="w-1/4 py-3 pr-4 text-left text-sm font-normal leading-6 text-gray-900"
                            >
                              {feature.name}
                              {featureIdx !== section.features.length - 1 ? (
                                <div className="absolute inset-x-8 mt-3 h-px bg-gray-200" />
                              ) : null}
                            </th>
                            {tiers.map((tier) => (
                              <td
                                key={tier.id}
                                className="relative w-1/4 px-4 py-0 text-center"
                              >
                                <span className="relative h-full w-full py-3">
                                  {typeof feature.tiers[tier.name] ===
                                  "string" ? (
                                    <span
                                      className={clsx(
                                        tier.featured
                                          ? "font-semibold text-sky-500"
                                          : "text-gray-900",
                                        "text-sm leading-6"
                                      )}
                                    >
                                      {feature.tiers[tier.name]}
                                    </span>
                                  ) : (
                                    <>
                                      {feature.tiers[tier.name] === true ? (
                                        <CheckCircleIcon
                                          className="mx-auto h-4 w-4 text-sky-500"
                                          aria-hidden="true"
                                        />
                                      ) : (
                                        <XCircleIcon
                                          className="mx-auto h-4 w-4 text-gray-400"
                                          aria-hidden="true"
                                        />
                                      )}

                                      <span className="sr-only">
                                        {feature.tiers[tier.name] === true
                                          ? "Yes"
                                          : "No"}
                                      </span>
                                    </>
                                  )}
                                </span>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Fake card borders */}
                    <div
                      className="pointer-events-none absolute inset-x-8 inset-y-0 grid grid-cols-4 gap-x-8 before:block"
                      aria-hidden="true"
                    >
                      {tiers.map((tier) => (
                        <div
                          key={tier.id}
                          className={clsx(
                            tier.featured
                              ? "ring-2 ring-sky-500"
                              : "ring-1 ring-gray-900/10",
                            "rounded-lg"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
