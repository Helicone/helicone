import { TrashIcon } from "@heroicons/react/24/outline";
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
import CreateOrgForm from "../organizations/createOrgForm";
import OrgMemberItem from "./orgMemberItem";

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

  const user = useUser();
  const router = useRouter();
  const { setNotification } = useNotification();
  const supabaseClient = useSupabaseClient();

  const [addOpen, setAddOpen] = useState(false);
  const [addEmail, setAddEmail] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);

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
    },
    ...members,
  ];

  return (
    <>
      <div className="py-4 flex flex-col text-gray-900 max-w-3xl space-y-8">
        <div className="flex flex-col md:flex-row space-y-16 md:space-y-0 space-x-0 md:space-x-4">
          <div className="flex flex-col w-full md:min-w-[400px] border-b md:border-b-0 md:border-r border-gray-300 py-8 pr-0 md:py-0 md:pr-8">
            <CreateOrgForm
              initialValues={{
                id: org.id,
                name: org.name,
                color: org.color || "",
                icon: org.icon || "",
              }}
            />
          </div>
          <div className="flex flex-col h-full pl-4 space-y-4 w-full max-w-screen md:max-w-[300px]">
            <div className="flex flex-row justify-between items-center">
              <p className="text-lg font-semibold">Members</p>
              <button
                onClick={() => setAddOpen(true)}
                className="bg-gray-900 hover:bg-gray-700 whitespace-nowrap rounded-md px-4 py-2 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
              >
                Add
              </button>
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
              <ul className="divide-y divide-gray-300">
                {orgMembers.map((member, index) => (
                  <OrgMemberItem
                    key={index}
                    index={index}
                    orgMember={member}
                    orgId={org.id}
                    refetch={refetch}
                    refreshOrgs={() => orgContext && orgContext?.refetchOrgs}
                  />
                ))}
              </ul>
            )}
          </div>
        </div>

        {isOwner && !org.is_personal && (
          <div className="py-28 flex flex-col">
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
      <ThemedModal open={addOpen} setOpen={setAddOpen}>
        <div className="flex flex-col gap-4 w-full">
          <p className="font-semibold text-lg">Add New Member</p>
          <div className="space-y-1.5 text-sm w-[400px]">
            <label htmlFor="api-key">User Email</label>
            <input
              type="text"
              name="api-key"
              id="api-key"
              value={addEmail}
              className={clsx(
                "block w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm"
              )}
              placeholder={"Enter user email"}
              onChange={(e) => setAddEmail(e.target.value)}
            />
          </div>
          <div className="w-full flex justify-end gap-4 mt-4">
            <button
              onClick={() => {
                setAddOpen(false);
              }}
              className={clsx(
                "relative inline-flex items-center rounded-md hover:bg-gray-50 bg-white px-4 py-2 text-sm font-medium text-gray-700"
              )}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                fetch(
                  `/api/organization/${org.id}/add_member?email=${addEmail}`
                )
                  .then((res) => res.json())
                  .then((res) => {
                    if (res.error) {
                      if (res.error.length < 30) {
                        setNotification(res.error, "error");
                        console.error(res);
                      } else {
                        setNotification("Error adding member", "error");
                        console.error(res);
                      }
                    } else {
                      setNotification("Member added successfully", "success");
                    }
                    refetch();
                    setAddOpen(false);
                  });
              }}
              className={clsx(
                "relative inline-flex items-center rounded-md hover:bg-sky-400 bg-sky-500 px-4 py-2 text-sm font-medium text-white"
              )}
            >
              Add Member
            </button>
          </div>
        </div>
      </ThemedModal>
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
