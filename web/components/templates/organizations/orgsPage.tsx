import { RadioGroup, Tab } from "@headlessui/react";
import { PlusIcon } from "@heroicons/react/20/solid";
import {
  BuildingOfficeIcon,
  CreditCardIcon,
  KeyIcon,
  PencilIcon,
  TrashIcon,
  UserIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";

import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import generateApiKey from "generate-api-key";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { DEMO_EMAIL } from "../../../lib/constants";
import { hashAuth } from "../../../lib/hashClient";
import { middleTruncString } from "../../../lib/stringHelpers";

import { useGetKeys } from "../../../services/hooks/keys";
import { Database } from "../../../supabase/database.types";
import { clsx } from "../../shared/clsx";
import LoadingAnimation from "../../shared/loadingAnimation";
import useNotification from "../../shared/notification/useNotification";
import ThemedModal from "../../shared/themed/themedModal";
import ThemedTable from "../../shared/themed/themedTable";
import ThemedTabs from "../../shared/themed/themedTabs";
import { useQuery } from "@tanstack/react-query";
import { Members } from "../../../pages/api/organization/[id]/members";
import { Owner } from "../../../pages/api/organization/[id]/owner";
import { useGetOrgs } from "../../../services/hooks/organizations";
import { getUSDate } from "../../shared/utils/utils";
import OrgCard from "./orgCard";
import { useOrg } from "../../shared/layout/organizationContext";
import CreateOrgForm from "./createOrgForm";

interface OrgsPageProps {}

const OrgsPage = (props: OrgsPageProps) => {
  const [createOpen, setCreateOpen] = useState(false);

  const user = useUser();

  const orgContext = useOrg();

  const yourOrgs = orgContext?.allOrgs.filter((d) => d.owner === user?.id);
  const otherOrgs = orgContext?.allOrgs?.filter((d) => d.owner !== user?.id);

  return (
    <>
      <div className="py-4 flex flex-col text-gray-900 max-w-2xl space-y-8">
        <div className=" flex flex-col space-y-6">
          <div className="flex flex-row justify-between items-center">
            <p className="text-md font-semibold">Your Organizations</p>
            <button
              onClick={() => setCreateOpen(true)}
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
