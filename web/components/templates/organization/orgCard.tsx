import {
  BuildingOffice2Icon,
  BuildingOfficeIcon,
  BuildingStorefrontIcon,
  EllipsisVerticalIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import Link from "next/link";
import { useState } from "react";
import {
  useGetOrgMembers,
  useGetOrgOwner,
} from "../../../services/hooks/organizations";
import { Database } from "../../../supabase/database.types";
import { clsx } from "../../shared/clsx";
import useNotification from "../../shared/notification/useNotification";
import ThemedModal from "../../shared/themed/themedModal";
import { getUSDate } from "../../shared/utils/utils";
import { ORGANIZATION_COLORS, ORGANIZATION_ICONS } from "./createOrgForm";

interface OrgCardProps {
  org: Database["public"]["Tables"]["organization"]["Row"];
  refetchOrgs: () => void;
  isOwner?: boolean;
}

const OrgCard = (props: OrgCardProps) => {
  const { org, refetchOrgs, isOwner = false } = props;
  const user = useUser();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const supabaseClient = useSupabaseClient<Database>();

  const { data: orgOwner, isLoading: isOrgOwnerLoading } = useGetOrgOwner(
    org.id
  );

  const {
    data: orgMembers,
    isLoading: isOrgMembersLoading,
    refetch,
  } = useGetOrgMembers(org.id);

  const { setNotification } = useNotification();

  const isLoading = isOrgOwnerLoading || isOrgMembersLoading;

  const icon = ORGANIZATION_ICONS.find((icon) => icon.name === org.icon);
  const color = ORGANIZATION_COLORS.find((color) => color.name === org.color);

  return (
    <>
      <li
        key={org.id}
        className="overflow-hidden border border-gray-300 rounded-xl w-full"
      >
        <Link href={`/organizations/${org.id}`}>
          <div
            className={clsx(
              color ? color.bgColor : "bg-gray-200",
              "p-4 flex flex-row justify-between items-center"
            )}
          >
            <div className="flex flex-row space-x-4 items-center">
              {icon ? (
                <icon.icon
                  className={clsx(
                    color ? color.textColor : "text-gray-200",
                    "h-8 w-8 bg-white p-1.5 rounded-md"
                  )}
                />
              ) : (
                <BuildingOfficeIcon className="h-8 w-8 bg-white p-1.5 rounded-md" />
              )}
              <p className="text-md font-semibold flex-1 overflow-ellipsis truncate w-[200px]">
                {org.name}
              </p>
            </div>
            <EllipsisVerticalIcon className="h-6 w-6 text-gray-500" />
          </div>
          <div className="bg-white px-4 flex flex-col divide-y divide-gray-200 text-sm">
            {isOwner ? (
              <div className="py-3 flex flex-row justify-between">
                <p className="text-gray-500">Created At</p>
                <p className="text-gray-700">
                  {getUSDate(org.created_at as string)}
                </p>
              </div>
            ) : (
              <div className="py-3 flex flex-row justify-between">
                <p className="text-gray-500">Owner</p>
                <p className="text-gray-700">{orgOwner?.data?.at(0)?.email}</p>
              </div>
            )}

            <div className="py-3 flex flex-row justify-between">
              <p className="text-gray-500">Members</p>
              <div className="text-gray-700">
                {isLoading ? (
                  <div className="h-4 w-8 bg-gray-300 rounded-xl animate-pulse" />
                ) : (
                  `${(orgMembers?.data?.length || 0) + 1}`
                )}
              </div>
            </div>
          </div>
        </Link>
      </li>
    </>
  );
};

export default OrgCard;
