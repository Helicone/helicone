import { useUser } from "@supabase/auth-helpers-react";
import { useState } from "react";
import { useLocalStorage } from "../../../../services/hooks/localStorage";
import { Database } from "../../../../supabase/database.types";
import { Row } from "../../../layout/common";
import { clsx } from "../../../shared/clsx";
import CreateOrgForm from "../createOrgForm";
import { DeleteOrgModal } from "../deleteOrgModal";

interface OrgSettingsPageProps {
  org: Database["public"]["Tables"]["organization"]["Row"];
  variant?: "organization" | "reseller";
}

const OrgSettingsPage = (props: OrgSettingsPageProps) => {
  const { org, variant = "organization" } = props;
  const user = useUser();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [, setOpenDemo] = useLocalStorage("openDemo", false);
  const [, setRemovedDemo] = useLocalStorage("removedDemo", false);

  const isOwner = org.owner === user?.id;

  return (
    <>
      <div className="py-4 flex flex-col text-gray-900 dark:text-gray-100 w-full max-w-2xl">
        <div className="text-sm pb-8 max-w-[450px] w-full flex flex-col space-y-1.5">
          <label
            htmlFor="org-id"
            className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100"
          >
            Organization Id
          </label>
          <input
            type="text"
            name="org-id"
            id="org-id"
            value={org.id}
            className={clsx(
              "block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 shadow-sm p-2 text-sm"
            )}
            placeholder={"Your shiny new org name"}
            disabled
          />
        </div>
        <div className="max-w-[450px] w-full">
          <CreateOrgForm
            initialValues={{
              id: org.id,
              name: org.name,
              color: org.color || "",
              icon: org.icon || "",
              limits: org.limits as any,
              providerKey: "",
            }}
            variant={"organization"}
          />
          <Row className="w-full justify-end mt-10 ">
            <button
              className="bg-white rounded-lg px-5 py-2 text-sm font-medium text-gray-900 shadow-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-30"
              onClick={() => {
                setOpenDemo(true);
                setRemovedDemo(false);
                window.location.reload();
              }}
            >
              Launch Demo Widget (Reload) 🚀
            </button>
          </Row>
        </div>
        {isOwner && (
          <div className="py-20 flex flex-col">
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
      <DeleteOrgModal
        open={deleteOpen}
        setOpen={setDeleteOpen}
        orgId={org.id}
        onDeleteRoute={"/dashboard"}
        orgName={org.name}
      />
    </>
  );
};

export default OrgSettingsPage;
