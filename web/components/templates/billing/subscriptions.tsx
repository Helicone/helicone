import { CheckIcon } from "@heroicons/react/24/outline";
import { SparklesIcon } from "@heroicons/react/24/solid";
import { Tier } from "./billingPage";

const pricing: {
  tiers: {
    title: string;
    tier: Tier;
    price: number;
    frequency: string;
    description: string;
    features: string[];
    cta: string;
    mostPopular: boolean;
  }[];
} = {
  tiers: [
    {
      title: "Free",
      tier: "free",
      price: 0,
      frequency: "/month",
      description: "The essentials to provide your best work for clients.",
      features: [
        "1,000 monthly requests",
        "Discord/OSS community",
        "User metrics",
      ],
      cta: "Switch to Free",
      mostPopular: false,
    },
    {
      title: "Pro",
      tier: "pro",
      price: 200,
      frequency: "/month",
      description: "A plan that scales with your rapidly growing business.",
      features: [
        "1 million monthly requests",
        "Priority support",
        "Early access to new features",
      ],
      cta: "Upgrade",
      mostPopular: false,
    },
    {
      title: "Enterprise",
      tier: "enterprise",
      price: 48,
      frequency: "/month",
      description: "Dedicated support and infrastructure for your company.",
      features: [
        "Unlimited monthly requests",
        "Prompt Discovery",
        "Dedicated support",
        "Feature prioritization",
        "Advanced analytics",
      ],
      cta: "Contact us",
      mostPopular: false,
    },
  ],
};

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

function SubscriptionButton({
  activeSubscription,
  buttonTier,
  cta,
  onClick,
}: {
  activeSubscription: Tier;
  buttonTier: Tier;
  cta: string;
  onClick: (tier: Tier) => void;
}) {
  const disabled =
    buttonTier === activeSubscription ||
    (activeSubscription === "pro-pending-cancel" && buttonTier === "free");

  let ctaElement: JSX.Element = <>{cta}</>;
  if (activeSubscription === "pro-pending-cancel" && buttonTier === "free") {
    ctaElement = <>Pro still active</>;
  } else if (
    buttonTier === "pro" &&
    activeSubscription === "pro-pending-cancel"
  ) {
    ctaElement = <>Undo Cancel</>;
  } else if (buttonTier === "pro" && activeSubscription === "free") {
    ctaElement = (
      <>
        Upgrade <SparklesIcon className="h-5 w-5 ml-2" />
      </>
    );
  } else if (buttonTier === "pro" && activeSubscription === "enterprise") {
    ctaElement = <>Downgrade</>;
  } else if (buttonTier === activeSubscription) {
    ctaElement = <>Current plan</>;
  }

  return (
    <button
      onClick={() => onClick(buttonTier)}
      className={classNames(
        disabled
          ? "bg-gray-400 text-white "
          : "bg-black text-gray-100 hover:bg-indigo-700 transition-colors",
        "mt-8 block w-full py-3 px-6 border border-transparent text-center rounded-b-sm font-medium"
      )}
      disabled={disabled}
    >
      <div className="flex items-center justify-center">
        <>{ctaElement}</>
      </div>
    </button>
  );
}

export default function Subscriptions({
  activeSubscription,
  onClick,
}: {
  activeSubscription: Tier;
  onClick: (tier: Tier) => void;
}) {
  return (
    <div className="mt-24 space-y-12  max-w-md lg:max-w-full lg:grid lg:grid-cols-3 lg:gap-x-8 lg:space-y-0">
      {pricing.tiers.map((tier) => (
        <div
          key={tier.title}
          className={classNames(
            "relative flex flex-col drop-shadow-sm rounded-sm border border-gray-200 bg-white shadow-sm"
          )}
        >
          <div className="flex-1 flex-col ">
            <div className="flex items-center justify-between  bg-gray-100 px-6 py-2">
              <h3 className="text-xl font-semibold text-gray-900">
                {tier.title}
              </h3>
              {tier.title === "Enterprise" ? (
                <span className="text-sm">contact us</span>
              ) : (
                <span className="flex gap-1 items-center">
                  <span className="font-bold text-xl">${tier.price}</span>
                  <span className="text-sm">per month</span>
                </span>
              )}
            </div>
            <ul
              role="list"
              className="space-y-2 divide-gray-200 mx-10 pt-5 text-sm"
            >
              {tier.features.map((feature) => (
                <li key={feature} className="flex gap-5 items-center">
                  <CheckIcon
                    className="h-5 w-5 flex-shrink-0 text-blue-500"
                    aria-hidden="true"
                  />
                  <span className="text-gray-500">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
          <SubscriptionButton
            activeSubscription={activeSubscription}
            buttonTier={tier.tier}
            cta={tier.cta}
            onClick={onClick}
          />
        </div>
      ))}
    </div>
  );
}
