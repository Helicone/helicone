import {
  BuildingOfficeIcon,
  CloudArrowUpIcon,
  PencilIcon,
  TrashIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import { useState } from "react";
import {
  useGetOrgMembers,
  useGetOrgOwner,
} from "../../../services/hooks/organizations";
import { Database } from "../../../supabase/database.types";
import { clsx } from "../../shared/clsx";
import { useOrg } from "../../shared/layout/organizationContext";
import useNotification from "../../shared/notification/useNotification";
import ThemedModal from "../../shared/themed/themedModal";
import { getUSDate } from "../../shared/utils/utils";
import CreateOrgForm, {
  ORGANIZATION_COLORS,
  ORGANIZATION_ICONS,
} from "./createOrgForm";
import OrgMemberItem from "./orgMemberItem";
import AddMemberModal from "./addMemberModal";
import { useGetRequestCountClickhouse } from "../../../services/hooks/requests";
import { endOfMonth, formatISO, startOfMonth } from "date-fns";
import UpgradeProModal from "../../shared/upgradeProModal";

interface OrgIdPageProps {
  org: Database["public"]["Tables"]["organization"]["Row"];
}

const OrgIdPage = (props: OrgIdPageProps) => {
  const { org } = props;
  const { data, isLoading, refetch } = useGetOrgMembers(org.id);

  const orgContext = useOrg();

  const { data: orgOwner, isLoading: isOrgOwnerLoading } = useGetOrgOwner(
    org.id
  );

  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));

  const startOfMonthFormatted = formatISO(currentMonth, {
    representation: "date",
  });
  const endOfMonthFormatted = formatISO(endOfMonth(currentMonth), {
    representation: "date",
  });

  const {
    count,
    isLoading: isCountLoading,
    refetch: refetchCount,
  } = useGetRequestCountClickhouse(
    startOfMonthFormatted,
    endOfMonthFormatted,
    org.id
  );

  const user = useUser();
  const router = useRouter();
  const { setNotification } = useNotification();
  const supabaseClient = useSupabaseClient();

  const [addOpen, setAddOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [openUpgradeModal, setOpenUpgradeModal] = useState(false);

  const isOwner = org.owner === user?.id;

  const members = data?.data
    ? data?.data.map((d) => {
        return {
          ...d,
          isOwner: false,
        };
      })
    : [];

  const orgMembers = [
    {
      email: orgOwner?.data?.at(0)?.email,
      member: "",
      isOwner: true,
      org_role: "admin",
    },
    ...members,
  ];

  const isUserAdmin =
    isOwner ||
    orgMembers.find((m) => m.member === user?.id)?.org_role === "admin";

  const currentIcon = ORGANIZATION_ICONS.find((icon) => icon.name === org.icon);

  const currentColor = ORGANIZATION_COLORS.find(
    (icon) => icon.name === org.color
  );

  const onLeaveSuccess = () => {
    const ownedOrgs = orgContext?.allOrgs.filter(
      (org) => org.owner === user?.id
    );
    if (orgContext && ownedOrgs && ownedOrgs.length > 0) {
      orgContext.refetchOrgs();
      orgContext.setCurrentOrg(ownedOrgs[0].id);
    }
  };

  const capitalizeHelper = (str: string) => {
    const words = str.split("_");
    const capitalizedWords = words.map(
      (word) => word.charAt(0).toUpperCase() + word.slice(1)
    );
    return capitalizedWords.join(" ");
  };

  return (
    <>
      <div className="py-4 flex flex-col text-gray-900 w-full space-y-4 max-w-2xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between w-full">
          <div className="flex flex-row justify-between items-center w-full">
            <div className="flex flex-col space-y-1 w-full">
              <div className="flex flex-row items-center gap-3">
                {currentIcon && (
                  <currentIcon.icon
                    className={clsx(
                      `text-${currentColor?.name}-500`,
                      "h-8 w-8"
                    )}
                  />
                )}
                <h1 className="text-3xl font-semibold">{org.name}</h1>
              </div>
              {org.created_at !== null && (
                <p className="text-gray-700 text-sm leading-6">
                  Created at: {getUSDate(org.created_at)}
                </p>
              )}
            </div>
            {isUserAdmin && (
              <button
                onClick={() => setEditOpen(true)}
                className="ml-4 flex flex-row items-center rounded-md bg-gray-50 px-4 py-2 text-sm font-semibold border border-gray-300 hover:bg-gray-200 text-gray-900 shadow-sm hover:text-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500"
              >
                Edit
              </button>
            )}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row sm:space-x-8">
          <div className="flex flex-wrap items-baseline justify-between gap-y-2 pt-8 min-w-[200px]">
            <dt className="text-sm leading-6 text-gray-700 flex flex-row gap-1 items-center">
              Your Plan
              {org.tier === "free" ? (
                <button
                  onClick={() => setOpenUpgradeModal(true)}
                  className="bg-white border border-gray-300 hover:bg-gray-50 rounded-md px-2 py-1 text-xs ml-1 flex flex-row items-center gap-1"
                >
                  <CloudArrowUpIcon className="h-4 w-4 inline" />
                  Upgrade
                </button>
              ) : (
                <button
                  onClick={async () => {
                    const x = await fetch(
                      "/api/subscription/get_portal_link"
                    ).then((res) => res.json());
                    if (!x.data) {
                      setNotification("Error getting link", "error");
                      return;
                    }

                    window.open(x.data, "_blank");
                  }}
                  className="bg-white border border-gray-300 hover:bg-gray-50 rounded-md px-2 py-1 text-xs ml-1 flex flex-row items-center gap-1"
                >
                  Manage
                </button>
              )}
            </dt>
            <dd className="w-full flex-none text-3xl font-medium leading-10 tracking-tight text-gray-900">
              {capitalizeHelper(org.tier || "")}
            </dd>
          </div>

          <div className="flex flex-wrap items-baseline justify-between gap-y-2 pt-8 min-w-[200px]">
            <dt className="text-sm leading-6 text-gray-700">Requests</dt>
            <dd className="w-full flex-none text-3xl font-medium leading-10 tracking-tight text-gray-900">
              {org.tier === "free" ? (
                <div className="flex flex-row gap-1.5 items-center">
                  <span>{`${Number(count?.data).toLocaleString()}`}</span>
                  <span className="text-gray-400 text-sm">/</span>
                  <span className="text-sm text-gray-400">{`${Number(
                    1_000_000
                  ).toLocaleString()}`}</span>
                </div>
              ) : (
                `${Number(count?.data).toLocaleString()}`
              )}
            </dd>
          </div>
        </div>
        <div className="flex flex-col h-full space-y-4 w-full pt-16">
          <div className="flex flex-row justify-between items-center">
            <h3 className="text-lg font-semibold">Members</h3>
            {isUserAdmin && (
              <div className="flex flex-row space-x-4">
                <button
                  onClick={() => {
                    setAddOpen(true);
                  }}
                  className={clsx(
                    "items-center rounded-md bg-black px-4 py-2 text-sm flex font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  )}
                >
                  Invite Members
                </button>
              </div>
            )}
          </div>
          {isLoading || isOrgOwnerLoading ? (
            <ul className="flex flex-col space-y-6">
              {Array.from({ length: 3 }).map((_, index) => (
                <li
                  key={index}
                  className="h-6 flex flex-row justify-between gap-2 bg-gray-300 animate-pulse rounded-md"
                ></li>
              ))}
            </ul>
          ) : (
            <ul className="divide-y divide-gray-200 border-t border-gray-200">
              {orgMembers.map((member, index) => (
                <OrgMemberItem
                  key={index}
                  index={index}
                  orgMember={member}
                  orgId={org.id}
                  refetch={refetch}
                  isUserAdmin={isUserAdmin}
                  refreshOrgs={onLeaveSuccess}
                />
              ))}
            </ul>
          )}
        </div>
        {isOwner && !org.is_personal && (
          <div className="py-36 flex flex-col">
            <div className="flex flex-row">
              <button
                type="button"
                className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-30"
                onClick={() => setDeleteOpen(true)}
              >
                Delete Organization
              </button>
            </div>
          </div>
        )}
      </div>
      <UpgradeProModal open={openUpgradeModal} setOpen={setOpenUpgradeModal} />

      <ThemedModal open={editOpen} setOpen={setEditOpen}>
        <div className="w-[400px]">
          <CreateOrgForm
            onCancelHandler={setEditOpen}
            initialValues={{
              id: org.id,
              name: org.name,
              color: org.color || "",
              icon: org.icon || "",
            }}
          />
        </div>
      </ThemedModal>
      <AddMemberModal
        orgId={org.id}
        orgOwnerId={org.owner}
        open={addOpen}
        setOpen={setAddOpen}
        onSuccess={() => {
          refetch();
        }}
      />
      <ThemedModal open={deleteOpen} setOpen={setDeleteOpen}>
        <div className="flex flex-col gap-4 w-full">
          <p className="font-semibold text-lg">Delete Organization</p>
          <p className="text-gray-700 w-[400px] whitespace-pre-wrap text-sm">
            This organization will be deleted from your account. API requests
            already made with this organization&apos;s will still be stored on
            our servers.
          </p>
          <p className="text-gray-700 w-[400px] whitespace-pre-wrap text-sm">
            If you delete this organization and re-add the keys to it later, the
            requests made with this organization will become visible again.
          </p>
          <div className="w-full flex justify-end gap-4 mt-4">
            <button
              onClick={() => {
                setDeleteOpen(false);
              }}
              className={clsx(
                "relative inline-flex items-center rounded-md hover:bg-gray-50 bg-white px-4 py-2 text-sm font-medium text-gray-700"
              )}
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                const { data, error } = await supabaseClient
                  .from("organization")
                  .update({ soft_delete: true })
                  .eq("id", org.id);

                if (error) {
                  setNotification("Error deleting organization", "error");
                  setDeleteOpen(false);
                } else {
                  orgContext?.refetchOrgs();
                  setDeleteOpen(false);
                  router.push("/organizations");
                  setNotification("Delete organization", "success");
                }
              }}
              className={clsx(
                "relative inline-flex items-center rounded-md hover:bg-red-700 bg-red-500 px-4 py-2 text-sm font-medium text-white"
              )}
            >
              Delete
            </button>
          </div>
        </div>
      </ThemedModal>
    </>
  );
};

export default OrgIdPage;
