import {
  BellIcon,
  CircleStackIcon,
  FolderArrowDownIcon,
  KeyIcon,
  TagIcon,
  UserMinusIcon,
} from "@heroicons/react/20/solid";

const features = [
  {
    name: "Labels and Feedback.",
    description:
      "Easily segment requests, environments, and more with custom properties.",
    icon: TagIcon,
  },
  {
    name: "Caching.",
    description:
      "Lower costs and improve performance as well as configure your cache responses.",
    icon: CircleStackIcon,
  },
  {
    name: "User Rate Limiting.",
    description:
      "Rate limit power users by requests, costs, and more to prevent abuse.",
    icon: UserMinusIcon,
  },
  {
    name: "Alerts.",
    description:
      "Get notified when your application is down, slow, or experiencing issues.",
    icon: BellIcon,
  },
  {
    name: "Key Vault",
    description:
      "Securely map and manage your API keys, tokens, and other secrets.",
    icon: KeyIcon,
  },
  {
    name: "Exporting.",
    description:
      "Extract, transform, and load your data using our GraphQL API, webhooks, and more.",
    icon: FolderArrowDownIcon,
  },
];

export default function Platform() {
  return (
    <>
      <div className="flex flex-col space-y-2 pb-2 w-full items-center">
        <h3 className="text-3xl sm:text-5xl font-bold text-black text-center tracking-tight leading-tight">
          One platform,{" "}
          <span className="text-green-500">everything you need</span>
        </h3>
        <p className="text-lg md:text-xl text-gray-600 max-w-2xl text-center">
          Everything you need to build, deploy, and scale your application
        </p>
      </div>
      <div className="relative overflow-hidden pt-8">
        <div className="mx-auto max-w-8xl px-6 lg:px-8">
          <img
            src="/assets/home/bento/dashboard.webp"
            alt="App screenshot"
            className="mb-[-12%] rounded-xl shadow-2xl ring-1 ring-gray-900/10"
            width={2432}
            height={1442}
          />
          <div className="relative" aria-hidden="true">
            <div className="absolute -inset-x-20 bottom-0 bg-gradient-to-t from-gray-50 pt-[7%]" />
          </div>
        </div>
      </div>
      <div className="mx-auto mt-16 max-w-8xl px-6 sm:mt-20 md:mt-24 lg:px-8">
        <dl className="mx-auto grid max-w-2xl grid-cols-1 gap-x-6 gap-y-10 text-base leading-7 text-gray-600 sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-3 lg:gap-x-8 lg:gap-y-16">
          {features.map((feature) => (
            <div key={feature.name} className="relative pl-9">
              <dt className="inline font-semibold text-gray-900">
                <feature.icon
                  className="absolute left-1 top-1 h-5 w-5 text-green-500"
                  aria-hidden="true"
                />
                {feature.name}
              </dt>{" "}
              <dd className="inline">{feature.description}</dd>
            </div>
          ))}
        </dl>
      </div>
    </>
  );
}
