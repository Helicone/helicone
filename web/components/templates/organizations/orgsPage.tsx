import { useUser } from "@supabase/auth-helpers-react";
import { useState } from "react";
import { useUserSettings } from "../../../services/hooks/userSettings";

import { useOrg } from "../../shared/layout/organizationContext";
import useNotification from "../../shared/notification/useNotification";
import ThemedModal from "../../shared/themed/themedModal";
import CreateOrgForm from "./createOrgForm";
import OrgCard from "./orgCard";

interface OrgsPageProps {}

const OrgsPage = (props: OrgsPageProps) => {
  const [createOpen, setCreateOpen] = useState(false);

  const user = useUser();

  const orgContext = useOrg();

  const { userSettings, error } = useUserSettings(user?.id || "");

  const { setNotification } = useNotification();

  const yourOrgs = orgContext?.allOrgs.filter((d) => d.owner === user?.id);
  const otherOrgs = orgContext?.allOrgs?.filter((d) => d.owner !== user?.id);

  return (
    <>
      <div className="py-4 flex flex-col text-gray-900 max-w-2xl space-y-8">
        <div className=" flex flex-col space-y-6">
          <div className="flex flex-row justify-between items-center">
            <p className="text-md font-semibold">Your Organizations</p>
            <button
              onClick={() => {
                if (
                  !(
                    userSettings?.tier === "pro" ||
                    userSettings?.tier === "enterprise"
                  ) &&
                  process.env.NEXT_PUBLIC_HELICONE_RESTRICT_PRO === "true"
                ) {
                  setNotification(
                    "You must be on a paid plan to create an organization.",
                    "error"
                  );
                  return;
                }
                setCreateOpen(true);
              }}
              className="bg-gray-900 hover:bg-gray-700 whitespace-nowrap rounded-md px-4 py-2 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
            >
              Create New Organization
            </button>
          </div>

          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {orgContext ? (
              yourOrgs?.map((org) => (
                <OrgCard
                  org={org}
                  key={org.id}
                  refetchOrgs={orgContext.refetchOrgs}
                  isOwner
                />
              ))
            ) : (
              <div className="h-40 w-full max-w-xs bg-gray-300 rounded-xl animate-pulse" />
            )}
          </ul>
        </div>
        {orgContext?.allOrgs && otherOrgs && otherOrgs.length > 0 && (
          <div className="border-t border-gray-200 flex flex-col space-y-4 py-4">
            <p className="text-md font-semibold">Other Organizations</p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {otherOrgs?.map((org) => (
                <OrgCard
                  org={org}
                  key={org.id}
                  refetchOrgs={orgContext.refetchOrgs}
                />
              ))}
            </ul>
          </div>
        )}
      </div>
      <ThemedModal open={createOpen} setOpen={setCreateOpen}>
        <div className="w-[400px]">
          <CreateOrgForm onCancelHandler={setCreateOpen} />
        </div>
      </ThemedModal>
    </>
  );
};

export default OrgsPage;
