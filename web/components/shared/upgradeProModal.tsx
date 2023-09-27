import {
  BuildingOffice2Icon,
  CloudArrowUpIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { useUser } from "@supabase/auth-helpers-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useOrg } from "./layout/organizationContext";
import ThemedModal from "./themed/themedModal";
import Stripe from "stripe";
import getStripe from "../../utlis/getStripe";
import {
  ORGANIZATION_COLORS,
  ORGANIZATION_ICONS,
} from "../templates/organization/createOrgForm";
import { clsx } from "./clsx";

interface UpgradeProModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const UpgradeProModal = (props: UpgradeProModalProps) => {
  const { open, setOpen } = props;
  const user = useUser();
  const [step, setStep] = useState(0);
  const orgContext = useOrg();
  const yourOrgs = orgContext?.allOrgs.filter((d) => d.owner === user?.id);

  const currentIcon = ORGANIZATION_ICONS.find(
    (icon) => icon.name === orgContext?.currentOrg.icon
  );

  const currentColor = ORGANIZATION_COLORS.find(
    (icon) => icon.name === orgContext?.currentOrg.color
  );

  async function handleCheckout() {
    const stripe = await getStripe();

    if (!stripe) {
      console.error("Stripe failed to initialize.");
      return;
    }

    const res = await fetch("/api/stripe/create_pro_subscription", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        orgId: orgContext?.currentOrg.id,
        userEmail: user?.email,
      }),
    });

    const { sessionId } = await res.json();

    const result = await stripe.redirectToCheckout({ sessionId });

    if (result.error) {
      console.error(result.error.message);
    }
  }

  return (
    <ThemedModal open={open} setOpen={setOpen}>
      <div className="flex flex-col w-[450px] space-y-8">
        <div className="flex flex-col space-y-4">
          <div className="flex flex-row items-center gap-2">
            {currentIcon && (
              <currentIcon.icon
                className={clsx(`text-${currentColor?.name}-500`, "h-6 w-6")}
              />
            )}
            <h1 className="text-xl font-semibold">
              {orgContext?.currentOrg.name}
            </h1>
          </div>
          <h1 className="text-md text-gray-900">
            This organization is on the free plan. Upgrade to remove request
            limits and unlock the features below:
          </h1>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            "Unlimited Requests",
            "Bucket Caching",
            "User Rate Limiting",
            "GraphQL API",
            "Request Retries",
            "Key Vault",
            "10 Seats",
            "Up to 2GB of storage",
          ].map((item, i) => (
            <div key={i} className="text-sm flex flex-row items-center">
              <SparklesIcon className="h-4 w-4 mr-2 text-yellow-500" />
              <span className="">{item}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-300 flex justify-end gap-2 pt-4">
          <button
            onClick={() => setOpen(false)}
            className="flex flex-row items-center rounded-md bg-white px-4 py-2 text-sm font-semibold border border-gray-300 hover:bg-gray-50 text-gray-900 shadow-sm hover:text-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={() => handleCheckout()}
            className="items-center rounded-md bg-black px-4 py-2 text-sm flex font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Upgrade to Pro
          </button>
        </div>
      </div>
    </ThemedModal>
  );
};

export default UpgradeProModal;
