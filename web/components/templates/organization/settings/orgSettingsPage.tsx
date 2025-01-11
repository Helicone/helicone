import { useUser } from "@supabase/auth-helpers-react";
import { useState, useMemo } from "react";
import { useLocalStorage } from "../../../../services/hooks/localStorage";
import { Database } from "../../../../supabase/database.types";
import { Row } from "../../../layout/common";
import { clsx } from "../../../shared/clsx";
import CreateOrgForm from "../createOrgForm";
import { DeleteOrgModal } from "../deleteOrgModal";
import { useIsGovernanceEnabled } from "../hooks";

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

  const isGovernanceEnabled = useIsGovernanceEnabled();

  const isOwner = org.owner === user?.id;

  const currentUsage = 0;

  const isUnlimited = useMemo(() => {
    return (
      isGovernanceEnabled.data?.data?.data?.governance_settings?.limitUSD === 0
    );
  }, [isGovernanceEnabled.data?.data?.data?.governance_settings?.limitUSD]);

  const totalUsage = useMemo(() => {
    return (
      (isGovernanceEnabled.data?.data?.data?.governance_settings
        ?.limitUSD as number) ?? 0
    );
  }, [isGovernanceEnabled.data?.data?.data?.governance_settings?.limitUSD]);

  const days = useMemo(() => {
    return isGovernanceEnabled.data?.data?.data?.governance_settings
      ?.days as number;
  }, [isGovernanceEnabled.data?.data?.data?.governance_settings?.days]);

  return (
    <>
      <div className="py-4 flex flex-col text-gray-900 dark:text-gray-100 w-full max-w-2xl">
        {isGovernanceEnabled.data?.data?.data && (
          <div className="space-y-4 p-6 border border-blue-200 rounded-lg bg-blue-50 dark:bg-blue-900/10 dark:border-blue-800  pb-10">
            <div className="flex flex-col space-y-2">
              <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Organization Governance
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                This organization is governed by your system administrator with
                a maximum monthly spend limit of $
                {totalUsage?.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
                .
              </p>
            </div>

            <div className="flex justify-between text-sm text-blue-800 dark:text-blue-200">
              <span>
                Current Usage: $
                {currentUsage.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
              {isUnlimited ? (
                <span>Unlimited</span>
              ) : (
                <span>
                  $
                  {totalUsage.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  limit
                </span>
              )}
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2.5 dark:bg-blue-800">
              <div
                className={clsx(
                  "h-2.5 rounded-full",
                  isUnlimited
                    ? "bg-green-500"
                    : currentUsage / totalUsage > 0.9
                    ? "bg-red-500"
                    : currentUsage / totalUsage > 0.7
                    ? "bg-yellow-500"
                    : "bg-green-500"
                )}
                style={{ width: `${(currentUsage / totalUsage) * 100}%` }}
              ></div>
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              Usage resets every {days} days
            </p>
          </div>
        )}
        <div className="text-sm pb-8 max-w-[450px] w-full flex flex-col space-y-1.5 mt-10">
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
