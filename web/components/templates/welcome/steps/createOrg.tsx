import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { useEffect, useState } from "react";
import { Database } from "../../../../supabase/database.types";
import { clsx } from "../../../shared/clsx";
import { useOrg } from "../../../shared/layout/organizationContext";
import useNotification from "../../../shared/notification/useNotification";
import { PostgrestError } from "@supabase/supabase-js";

export const COMPANY_SIZES = [
  "Select company size",
  "Just me",
  "2-5",
  "5-25",
  "25-100",
  "100+",
];

interface CreateOrgProps {
  nextStep: () => void;
}

const CreateOrg = (props: CreateOrgProps) => {
  const { nextStep } = props;

  const user = useUser();
  const [loaded, setLoaded] = useState(false);
  const [referralType, setReferralType] = useState<string>("");
  const supabaseClient = useSupabaseClient<Database>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { setNotification } = useNotification();
  const orgContext = useOrg();

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 500); // delay of 500ms
    return () => clearTimeout(timer); // this will clear Timeout
    // when component unmount like in willComponentUnmount
  }, []);

  const handleOrgCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!user) return;

    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const orgName = formData.get("org-name") as string;
    const orgSize = formData.get("org-size") as string;
    const orgReferral = formData.get("org-referral") as string;
    const referralCode = formData.get("referral-code") as string;

    if (orgSize === "Select company size") {
      setNotification("Please select a company size.", "info");
      setIsLoading(false);
      return;
    }

    if (orgReferral === "Select referral source") {
      setNotification("Please select a referral source.", "info");
      setIsLoading(false);
      return;
    }

    function checkError(error: PostgrestError | null) {
      if (error) {
        setNotification(
          "Failed to update organization. Please try again.",
          "error"
        );
        setIsLoading(false);
        return;
      }
    }

    if (!orgContext?.currentOrg?.id) {
      const { data, error } = await fetch("/api/organization/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: orgName,
          size: orgSize,
          referral: orgReferral,
          owner: user.id,
          is_personal: true,
          tier: "free",
        }),
      }).then((res) => res.json());
      if (!error) {
        console.log("Created personal org! - refetching", orgContext);
        orgContext?.refreshCurrentOrg();
      }
      checkError(error);
    } else {
      // update the current org
      const { error } = await supabaseClient
        .from("organization")
        .update({
          name: orgName,
          size: orgSize,
          referral: orgReferral,
        })
        .eq("id", orgContext?.currentOrg?.id ?? "");
      checkError(error);
    }

    if (referralCode && referralCode.trim() !== "") {
      fetch("/api/referral/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          referralCode: referralCode,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            setNotification(
              "Referral code not valid. Please try again.",
              "error"
            );
            setIsLoading(false);
            return;
          } else {
            setIsLoading(false);
            orgContext?.refetchOrgs();
            nextStep();
          }
        });
    } else {
      setIsLoading(false);
      orgContext?.refetchOrgs();
      nextStep();
    }
  };

  return (
    <div
      className={clsx(
        `transition-all duration-700 ease-in-out ${
          loaded ? "opacity-100" : "opacity-0"
        }`,
        "flex flex-col items-center w-full px-2 space-y-8 max-w-lg"
      )}
    >
      <div className="flex flex-col items-center text-center space-y-4">
        <p className="text-lg md:text-3xl font-semibold">
          Create a new organization
        </p>
        <p className="text-md md:text-lg text-gray-500 font-light">
          Join thousands of developers and organizations using Helicone today to
          monitor their applications.
        </p>
      </div>
      <form
        className="flex flex-col space-y-8 w-full px-4"
        onSubmit={handleOrgCreate}
      >
        <div className="flex flex-col space-y-2">
          <label
            htmlFor="org-name"
            className="block text-md font-semibold leading-6"
          >
            Organization Name
          </label>
          <div className="">
            <input
              type="text"
              name="org-name"
              id="org-name"
              required
              className={clsx(
                "bg-white dark:bg-black block w-full rounded-md border-0 px-4 py-4 text-md shadow-sm ring-1 ring-inset ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-600 sm:leading-6"
              )}
              placeholder={orgContext?.currentOrg?.name}
            />
          </div>
        </div>
        <div className="flex flex-col space-y-2 pt-4">
          <label
            htmlFor="org-size"
            className="block text-md font-semibold leading-6"
          >
            How large is your company?
          </label>
          <div className="">
            <select
              id="org-size"
              name="org-size"
              placeholder={
                orgContext?.currentOrg?.size || "Select company size"
              }
              className={clsx(
                "bg-white dark:bg-black block w-full rounded-md border-0 px-4 py-2 text-sm shadow-sm ring-1 ring-inset ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-600 sm:leading-6"
              )}
              required
            >
              {COMPANY_SIZES.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex flex-col space-y-2">
          <label
            htmlFor="org-referral"
            className="block text-md font-semibold leading-6"
          >
            How did you hear about us?
          </label>
          <div className="">
            <select
              id="org-referral"
              name="org-referral"
              placeholder={
                orgContext?.currentOrg?.referral || "Select referral source"
              }
              className={clsx(
                "bg-white dark:bg-black block w-full rounded-md border-0 px-4 py-2 text-sm shadow-sm ring-1 ring-inset ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-600 sm:leading-6"
              )}
              required
              onChange={(e) => setReferralType(e.target.value)}
            >
              {[
                "Select referral source",
                "Friend (referral)",
                "Google",
                "Twitter",
                "LinkedIn",
                "Microsoft for Startups",
                "Other",
              ].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
        </div>
        {referralType === "Friend (referral)" && (
          <div className="flex flex-col space-y-2">
            <label
              htmlFor="referral-code"
              className="block text-md font-semibold leading-6"
            >
              Referral Code (optional)
            </label>
            <div className="">
              <input
                id="referral-code"
                name="referral-code"
                placeholder={"Referral code"}
                className={clsx(
                  "bg-white dark:bg-black block w-full rounded-md border-0 px-4 py-2 text-sm shadow-sm ring-1 ring-inset ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-600 sm:leading-6"
                )}
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          className="px-28 py-3 bg-gray-900 hover:bg-gray-700 dark:bg-gray-100 dark:hover:bg-gray-300 dark:text-black font-medium text-white rounded-xl mt-8"
        >
          {isLoading && (
            <ArrowPathIcon className="animate-spin h-5 w-5 mr-2 inline" />
          )}
          {orgContext?.currentOrg ? "Create Organization" : "Next"}
        </button>
      </form>
    </div>
  );
};

export default CreateOrg;
