import { CheckIcon } from "lucide-react";
import { ContactCTA } from "./contactCTA";
import { UpgradeToProCTA } from "./upgradeToProCTA";

export const PricingCompare = ({
  featureName = "",
}: {
  featureName: string;
}) => {
  return (
    <>
      <p className="mb-4 text-sm text-gray-500">
        The Free plan only comes with 10,000 requests per month, but getting
        more is easy.
      </p>
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border p-4">
          <h3 className="mb-2 font-semibold">Free</h3>
          <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-600">
            Current plan
          </span>
          <ul className="mt-4 space-y-2">
            <li className="flex items-center text-sm">
              <CheckIcon className="mr-2 h-4 w-4 text-green-500" />
              10k free requests/month
            </li>
            <li className="flex items-center text-sm">
              <CheckIcon className="mr-2 h-4 w-4 text-green-500" />
              Access to Dashboard
            </li>
            <li className="flex items-center text-sm">
              <CheckIcon className="mr-2 h-4 w-4 text-green-500" />
              Free, truly
            </li>
          </ul>
        </div>
        <div className="rounded-lg border p-4">
          <h3 className="mb-2 font-semibold">Pro</h3>
          <span className="text-sm">$20/user</span>
          <p className="mt-2 text-sm">Everything in Free, plus:</p>
          <ul className="mt-4 space-y-2">
            <li className="flex items-center text-sm">
              <CheckIcon className="mr-2 h-4 w-4 text-green-500" />
              Limitless requests (first 100k free)
            </li>
            <li className="flex items-center text-sm">
              <CheckIcon className="mr-2 h-4 w-4 text-green-500" />
              Access to all features
            </li>
            <li className="flex items-center text-sm">
              <CheckIcon className="mr-2 h-4 w-4 text-green-500" />
              Standard support
            </li>
          </ul>
          <a href="#" className="mt-2 block text-sm text-blue-600">
            See all features →
          </a>
          <UpgradeToProCTA
            defaultPrompts={featureName === "Prompts"}
            showAddons={featureName === "Prompts"}
          />
        </div>
      </div>
      <ContactCTA />
    </>
  );
};
