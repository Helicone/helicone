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

  return (
    <ThemedModal open={open} setOpen={setOpen}>
      <div className="flex flex-col w-[400px] space-y-8">
        {step === 0 ? (
          <>
            <div className="flex flex-col space-y-4">
              <CloudArrowUpIcon className="h-10 w-10 text-sky-600" />
              <h1 className="text-xl font-semibold text-gray-900">
                You are currently on the free plan
              </h1>
              <p className="text-md text-gray-600">
                Upgrade to remove request limits and unlock the features below:
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                "Unlimited Requests",
                "Bucket Caching",
                "User Management",
                "Rate Limiting",
                "GraphQL API",
                "Request Retries",
                "Unlimited Organizations",
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
                onClick={() => setStep(1)}
                className="items-center rounded-md bg-black px-4 py-2 text-sm flex font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Upgrade to Pro
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col space-y-4">
              <CloudArrowUpIcon className="h-10 w-10 text-sky-600" />
              <h1 className="text-xl font-semibold text-gray-900">
                Upgrade to Pro
              </h1>
              <p className="text-md text-gray-600">
                All of the organizations you own will be upgraded to{" "}
                <span className="font-semibold text-gray-900">Pro</span> and get
                full access to its features.
              </p>
            </div>
            <div className="flex flex-col space-y-3">
              <p className="text-md text-gray-900 font-semibold">
                Organizations
              </p>
              <div className="grid grid-cols-1 gap-3">
                {yourOrgs?.map((org, i) => (
                  <div key={i} className="text-sm flex flex-row items-center">
                    <BuildingOffice2Icon className="h-5 w-5 mr-2 text-purple-500" />
                    <span className="text-md font-semibold text-gray-900">
                      {org.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-300 flex justify-end gap-2 pt-4">
              <button
                onClick={() => setStep(0)}
                className="flex flex-row items-center rounded-md bg-white px-4 py-2 text-sm font-semibold border border-gray-300 hover:bg-gray-50 text-gray-900 shadow-sm hover:text-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500"
              >
                Back
              </button>
              <button
                onClick={() => {
                  setOpen(false);
                  window.open(
                    `${process.env.NEXT_PUBLIC_HELICONE_PRO_LINK}?prefilled_email=${user?.email}`,
                    "_blank"
                  );
                }}
                className="items-center rounded-md bg-black px-4 py-2 text-sm flex font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                I Understand
              </button>
            </div>
          </>
        )}
      </div>
    </ThemedModal>
  );
};

export default UpgradeProModal;
