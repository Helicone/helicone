import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import { useState } from "react";
import {
  useGetOrgMembers,
  useGetOrgOwner,
} from "../../../services/hooks/organizations";
import { Database } from "../../../supabase/database.types";
import { clsx } from "../../shared/clsx";
import useNotification from "../../shared/notification/useNotification";
import ThemedModal from "../../shared/themed/themedModal";
import CreateOrgForm from "../organizations/createOrgForm";

interface OrgIdPageProps {
  org: Database["public"]["Tables"]["organization"]["Row"];
}

const OrgIdPage = (props: OrgIdPageProps) => {
  const { org } = props;
  const { data, isLoading, refetch } = useGetOrgMembers(org.id);

  const user = useUser();
  const router = useRouter();
  const { setNotification } = useNotification();
  const supabaseClient = useSupabaseClient();

  const [addOpen, setAddOpen] = useState(false);
  const [addEmail, setAddEmail] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);

  const isOwner = org.owner === user?.id;

  return (
    <>
      <div className="py-4 flex flex-col text-gray-900 max-w-2xl space-y-8">
        <div className="flex flex-col sm:flex-row space-x-4 sm:divide-x divide-gray-200 items-start h-[420px]">
          <div className="flex flex-col w-[400px] h-full ">
            <CreateOrgForm
              onCancelHandler={() => {
                console.log("Clear changes");
              }}
              initialValues={{
                name: org.name,
                color: org.color || "",
                icon: org.icon || "",
              }}
            />
          </div>
          <div className="flex flex-col flex-1 w-full h-full pl-4 space-y-4">
            <div className="flex flex-row justify-between items-center w-full">
              <p className="text-lg font-semibold">Members</p>
              <button
                onClick={() => setAddOpen(true)}
                className="bg-gray-900 hover:bg-gray-700 whitespace-nowrap rounded-md px-4 py-2 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500"
              >
                Add
              </button>
            </div>
            <ul className="divide-y divide-gray-300 w-full max-w-[250px]">
              {isLoading ? (
                <p>Loading...</p>
              ) : (
                data?.data?.map((member, index) => (
                  <li key={index} className="py-2 truncate overflow-ellipsis">
                    {member.email}
                  </li>
                ))
              )}
            </ul>
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
                  setNotification("Deleted. Redirecting...", "success");
                  setDeleteOpen(false);
                  router.push("/organizations");
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
