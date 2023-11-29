import Image from "next/image";
import { useEffect, useState } from "react";
import { clsx } from "../../../shared/clsx";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { Database } from "../../../../supabase/database.types";
import useNotification from "../../../shared/notification/useNotification";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { setOrgCookie } from "../../../../services/hooks/organizations";
import { OrgProps } from "../welcomePage";
import { useOrg } from "../../../shared/layout/organizationContext";

interface CreateOrgProps {
  nextStep: () => void;
  org: OrgProps | undefined;
  setOrg: (org: OrgProps) => void;
}

const CreateOrg = (props: CreateOrgProps) => {
  const { nextStep, org, setOrg } = props;

  const user = useUser();
  const [loaded, setLoaded] = useState(false);
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

    if (org?.name !== undefined) {
      nextStep();
      return;
    }

    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const orgName = formData.get("org-name") as string;
    const orgSize = formData.get("org-size") as string;
    const orgReferral = formData.get("org-referral") as string;

    const { data: orgData, error } = await supabaseClient
      .from("organization")
      .insert([
        {
          owner: user.id ?? "",
          name: orgName,
          size: orgSize,
          referral: orgReferral,
          is_personal: true,
        },
      ])
      .select(`id`);

    if (error) {
      setNotification(
        "Failed to create organization. Please try again.",
        "error"
      );
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    setOrg({
      id: orgData?.[0].id ?? "",
      name: orgName,
      size: orgSize,
      referral: orgReferral,
    });
    orgContext?.setCurrentOrg(orgData?.[0].id ?? "");

    nextStep();
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
        <p className="text-md md:text-lg text-gray-700 font-light">
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
            className="block text-md font-semibold leading-6 text-gray-900"
          >
            Organization Name
          </label>
          <div className="">
            <input
              disabled={org?.name !== undefined}
              type="text"
              name="org-name"
              id="org-name"
              required
              className={clsx(
                org?.name !== undefined && "bg-gray-100",
                "block w-full rounded-md border-0 px-4 py-4 text-md text-gray-900 shadow-sm ring-1 ring-inset ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-600 sm:leading-6"
              )}
              placeholder={org?.name ?? "Your Organization Name"}
            />
          </div>
        </div>
        <div className="flex flex-col space-y-2 pt-4">
          <label
            htmlFor="org-size"
            className="block text-md font-semibold leading-6 text-gray-900"
          >
            How large is your company?
          </label>
          <div className="">
            <select
              disabled={org?.name !== undefined}
              id="org-size"
              name="org-size"
              defaultValue={"Select company size"}
              className={clsx(
                org?.name !== undefined && "bg-gray-100",
                "block w-full rounded-md border-0 px-4 py-2 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-600 sm:leading-6"
              )}
            >
              {[
                "Select company size",
                "Just me",
                "1-5",
                "5-25",
                "25-100",
                "100+",
              ].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex flex-col space-y-2 pb-8">
          <label
            htmlFor="org-referral"
            className="block text-md font-semibold leading-6 text-gray-900"
          >
            How did you hear about us?
          </label>
          <div className="">
            <select
              disabled={org?.name !== undefined}
              id="org-referral"
              name="org-referral"
              defaultValue={"Select referral source"}
              className={clsx(
                org?.name !== undefined && "bg-gray-100",
                "block w-full rounded-md border-0 px-4 py-2 text-sm text-gray-900 shadow-sm ring-1 ring-inset ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-600 sm:leading-6"
              )}
            >
              {[
                "Select referral source",
                "Friend",
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
        <button
          type="submit"
          className="px-28 py-3 bg-gray-900 hover:bg-gray-700 font-medium text-white rounded-xl"
        >
          {isLoading && (
            <ArrowPathIcon className="animate-spin h-5 w-5 mr-2 inline" />
          )}
          {org?.name === undefined ? "Create Organization" : "Next"}
        </button>
      </form>
    </div>
  );
};

export default CreateOrg;
