import { RadioGroup } from "@headlessui/react";

import { useUser } from "@supabase/auth-helpers-react";
import { useState } from "react";
import { getJawnClient } from "../../../lib/clients/jawn";
import { DEMO_EMAIL } from "../../../lib/constants";
import { useOrg } from "../../layout/organizationContext";
import { clsx } from "../../shared/clsx";
import useNotification from "../../shared/notification/useNotification";
import ProviderKeyList from "../enterprise/portal/id/providerKeyList";
import CreateProviderKeyModal from "../vault/createProviderKeyModal";
import { useVaultPage } from "../vault/useVaultPage";
import { ORGANIZATION_COLORS, ORGANIZATION_ICONS } from "./orgConstants";

interface CreateOrgFormProps {
  variant?: "organization" | "reseller";
  onCancelHandler?: (open: boolean) => void;
  initialValues?: {
    id: string;
    name: string;
    color: string | null;
    icon: string | null;
    providerKey: string | null;
    limits?: OrgLimits;
  };
  onSuccess?: () => void;
}

export type OrgLimits = {
  cost: number;
  requests: number;
} | null;

const CreateOrgForm = (props: CreateOrgFormProps) => {
  const {
    variant = "organization",
    onCancelHandler,
    initialValues,
    onSuccess,
  } = props;

  const [orgName, setOrgName] = useState(initialValues?.name || "");
  const [limits, setLimits] = useState<{
    cost: number;
    requests: number;
  } | null>(
    variant === "reseller"
      ? initialValues?.limits
        ? initialValues.limits
        : {
            cost: 1_000,
            requests: 1_000,
          }
      : null
  );
  const [selectedColor, setSelectedColor] = useState(
    initialValues?.color
      ? ORGANIZATION_COLORS.find((c) => c.name === initialValues.color) ||
          ORGANIZATION_COLORS[0]
      : ORGANIZATION_COLORS[0]
  );
  const [selectedIcon, setSelectedIcon] = useState(
    initialValues?.icon
      ? ORGANIZATION_ICONS.find((i) => i.name === initialValues.icon) ||
          ORGANIZATION_ICONS[0]
      : ORGANIZATION_ICONS[0]
  );

  const user = useUser();
  const orgContext = useOrg();
  const { setNotification } = useNotification();
  const [providerKey, setProviderKey] = useState(
    initialValues?.providerKey || ""
  );

  const { providerKeys, refetchProviderKeys } = useVaultPage();

  const [isProviderOpen, setIsProviderOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col gap-4 w-full space-y-8">
        {initialValues || variant === "reseller" ? (
          <></>
        ) : (
          <p className="font-semibold text-lg text-gray-900 dark:text-gray-100">
            Create New Organization
          </p>
        )}
        <div className="space-y-1.5 text-sm">
          <label
            htmlFor="org-name"
            className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100"
          >
            {
              {
                organization: "Organization Name",
                reseller: "Customer Name",
              }[variant]
            }
          </label>
          <input
            type="text"
            name="org-name"
            id="org-name"
            value={orgName}
            className="bg-gray-50 dark:bg-gray-950 text-black dark:text-white block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-600 text-sm lg:text-md lg:leading-6"
            placeholder={
              variant === "organization"
                ? "Your shiny new org name"
                : "Customer name"
            }
            onChange={(e) => setOrgName(e.target.value)}
          />
        </div>
        <RadioGroup value={selectedColor} onChange={setSelectedColor}>
          <RadioGroup.Label className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">
            Choose a color
          </RadioGroup.Label>
          <div className="mt-4 flex items-center justify-between px-8">
            {ORGANIZATION_COLORS.map((color) => (
              <RadioGroup.Option
                key={color.name}
                value={color}
                className={({ active, checked }) =>
                  clsx(
                    color.selectedColor,
                    active && checked ? "ring ring-offset-1" : "",
                    !active && checked ? "ring-2" : "",
                    "relative -m-0.5 flex cursor-pointer items-center justify-center rounded-full p-0.5 focus:outline-none"
                  )
                }
              >
                <RadioGroup.Label as="span" className="sr-only">
                  {color.name}
                </RadioGroup.Label>
                <span
                  aria-hidden="true"
                  className={clsx(
                    color.bgColor,
                    "h-8 w-8 rounded-full border border-black dark:border-white border-opacity-10"
                  )}
                />
              </RadioGroup.Option>
            ))}
          </div>
        </RadioGroup>
        <RadioGroup value={selectedIcon} onChange={setSelectedIcon}>
          <RadioGroup.Label className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">
            Choose an icon
          </RadioGroup.Label>
          <div className="mt-4 flex items-center justify-between px-8">
            {ORGANIZATION_ICONS.map((icon) => (
              <RadioGroup.Option
                key={icon.name}
                value={icon}
                className={({ active, checked }) =>
                  clsx(
                    checked
                      ? "ring-2 ring-offset-1 ring-sky-300 dark:ring-sky-700"
                      : "ring-1 ring-gray-200 dark:ring-gray-800",
                    "bg-white dark:bg-black rounded-md p-2"
                  )
                }
              >
                <RadioGroup.Label as="span" className="sr-only">
                  {icon.name}
                </RadioGroup.Label>
                {
                  <icon.icon className="h-6 w-6 hover:cursor-pointer text-black dark:text-white" />
                }
              </RadioGroup.Option>
            ))}
          </div>
        </RadioGroup>
        {variant === "reseller" && (
          <>
            <div>
              <label
                htmlFor="org-limits"
                className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100"
              >
                Limits
              </label>
              <div className="flex flex-row mx-auto gap-4">
                <div className="space-y-1 text-sm">
                  <label
                    htmlFor="org-costs"
                    className="block text-xs leading-6 text-gray-500 "
                  >
                    Costs (USD)
                  </label>
                  <div className="flex flex-col gap-2">
                    <input
                      type="number"
                      name="org-costs"
                      id="org-costs"
                      disabled={limits?.cost !== -1}
                      value={limits?.cost === -1 ? 9999999 : limits?.cost ?? 0}
                      className={clsx(
                        "max-w-[10em] bg-gray-50 dark:bg-gray-950",
                        " block w-full rounded-md border-0 py-1.5",
                        "shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2",
                        "focus:ring-inset focus:ring-gray-600 text-sm lg:text-md lg:leading-6",
                        limits?.cost === -1
                          ? "text-gray-400"
                          : "text-black dark:text-white"
                      )}
                      onChange={(e) =>
                        setLimits((prev) =>
                          prev ? { ...prev, cost: +e.target.value } : null
                        )
                      }
                    />
                    <div className="flex gap-2 items-center">
                      <div>Unlimited</div>
                      <input
                        type="checkbox"
                        name="org-costs"
                        id="org-costs"
                        value={limits?.cost !== -1 ? 1 : 0}
                        className=""
                        onChange={(e) => {
                          if (limits?.cost === -1) {
                            setLimits((prev) =>
                              prev ? { ...prev, cost: 1000 } : null
                            );
                          } else {
                            setLimits((prev) =>
                              prev ? { ...prev, cost: -1 } : null
                            );
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-1 text-sm">
                  <label
                    htmlFor="org-costs"
                    className="block text-xs leading-6 text-gray-500 "
                  >
                    Request
                  </label>
                  <div className="flex flex-col gap-2">
                    <input
                      type="number"
                      name="org-request"
                      id="org-request"
                      disabled={limits?.requests !== -1}
                      value={
                        limits?.requests === -1
                          ? 9999999
                          : limits?.requests ?? 0
                      }
                      className={clsx(
                        "max-w-[10em] bg-gray-50 dark:bg-gray-950",
                        " block w-full rounded-md border-0 py-1.5",
                        "shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2",
                        "focus:ring-inset focus:ring-gray-600 text-sm lg:text-md lg:leading-6",
                        limits?.requests === -1
                          ? "text-gray-400"
                          : "text-black dark:text-white"
                      )}
                      onChange={(e) =>
                        setLimits((prev) =>
                          prev ? { ...prev, requests: +e.target.value } : null
                        )
                      }
                    />
                    <div className="flex gap-2 items-center">
                      <div>Unlimited</div>
                      <input
                        type="checkbox"
                        name="org-requests"
                        id="org-requests"
                        value={limits?.requests !== -1 ? 1 : 0}
                        className=""
                        onChange={(e) => {
                          if (limits?.requests === -1) {
                            setLimits((prev) =>
                              prev ? { ...prev, requests: 1000 } : null
                            );
                          } else {
                            setLimits((prev) =>
                              prev ? { ...prev, requests: -1 } : null
                            );
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <label
                    htmlFor="org-time"
                    className="block text-xs leading-6 text-gray-500"
                  >
                    Time Grain
                  </label>
                  <select
                    id="org-size"
                    name="org-size"
                    className="max-w-[10em] bg-gray-50 dark:bg-gray-950 text-black dark:text-white block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-gray-600 text-sm lg:text-md lg:leading-6"
                    required
                  >
                    <option value="word">monthly</option>
                  </select>
                </div>
              </div>
            </div>
            <ProviderKeyList
              orgProviderKey={initialValues?.providerKey || undefined}
              setProviderKeyCallback={setProviderKey}
            />
          </>
        )}
        <div className="border-t border-gray-300 flex justify-end gap-2 pt-8">
          <button
            onClick={() => {
              if (onCancelHandler) {
                onCancelHandler(false);
              } else {
                // reset to the initial values
                setOrgName(initialValues?.name || "");
                setSelectedColor(
                  initialValues?.color
                    ? ORGANIZATION_COLORS.find(
                        (c) => c.name === initialValues.color
                      ) || ORGANIZATION_COLORS[0]
                    : ORGANIZATION_COLORS[0]
                );
                setSelectedIcon(
                  initialValues?.icon
                    ? ORGANIZATION_ICONS.find(
                        (i) => i.name === initialValues.icon
                      ) || ORGANIZATION_ICONS[0]
                    : ORGANIZATION_ICONS[0]
                );
              }
            }}
            className="flex flex-row items-center rounded-md bg-white dark:bg-black px-4 py-2 text-sm font-semibold border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm hover:text-gray-700 dark:hover:text-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              if ((user?.email ?? "") === DEMO_EMAIL) {
                setNotification(
                  "Cannot create organization in demo mode",
                  "error"
                );
                return;
              }
              if (!orgName || orgName === "") {
                setNotification("Please provide an organization name", "error");
                return;
              }
              if (variant === "reseller" && providerKey === "") {
                setNotification("Please select a provider key", "error");
                return;
              }
              const jawn = getJawnClient(orgContext?.currentOrg?.id);
              if (initialValues) {
                const { error: updateOrgError } = await jawn.POST(
                  "/v1/organization/{organizationId}/update",
                  {
                    params: {
                      path: {
                        organizationId: initialValues.id,
                      },
                    },
                    body: {
                      name: orgName,
                      color: selectedColor.name,
                      icon: selectedIcon.name,
                      variant,
                      ...(variant === "reseller" && {
                        org_provider_key: providerKey,
                        limits: limits || undefined,
                        reseller_id: orgContext?.currentOrg?.id!,
                        organization_type: "customer",
                      }),
                    },
                  }
                );

                if (updateOrgError) {
                  setNotification("Failed to update organization", "error");
                } else {
                  setNotification(
                    "Organization updated successfully",
                    "success"
                  );
                  onSuccess && onSuccess();
                }
                onCancelHandler && onCancelHandler(false);
                orgContext?.refetchOrgs();
              } else {
                const { error: createOrgError } = await jawn.POST(
                  "/v1/organization/create",
                  {
                    body: {
                      name: orgName,
                      owner: user?.id!,
                      color: selectedColor.name,
                      icon: selectedIcon.name,
                      has_onboarded: true,
                      tier: "free",
                      ...(variant === "reseller" && {
                        org_provider_key: providerKey,
                        limits: limits || undefined,
                        reseller_id: orgContext?.currentOrg?.id!,
                        organization_type: "customer",
                      }),
                    },
                  }
                );
                if (createOrgError) {
                  setNotification(
                    "Failed to create organization" + createOrgError,
                    "error"
                  );
                } else {
                  setNotification(
                    "Organization created successfully",
                    "success"
                  );
                  onSuccess && onSuccess();
                }
                onCancelHandler && onCancelHandler(false);
                orgContext?.refetchOrgs();
              }
            }}
            className="items-center rounded-md bg-black dark:bg-white px-4 py-2 text-sm flex font-semibold text-white dark:text-black shadow-sm hover:bg-gray-800 dark:hover:bg-gray-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {initialValues ? "Update" : "Create"}
          </button>
        </div>
      </div>

      <CreateProviderKeyModal
        open={isProviderOpen}
        variant={"portal"}
        setOpen={setIsProviderOpen}
        onSuccess={() => refetchProviderKeys()}
      />
    </>
  );
};

export default CreateOrgForm;
