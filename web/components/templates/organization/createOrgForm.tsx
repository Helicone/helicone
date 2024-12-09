import { RadioGroup } from "@headlessui/react";

import { useUser } from "@supabase/auth-helpers-react";
import { useState } from "react";
import { getJawnClient } from "../../../lib/clients/jawn";
import { DEMO_EMAIL } from "../../../lib/constants";
import { useOrg } from "../../layout/org/organizationContext";
import { clsx } from "../../shared/clsx";
import useNotification from "../../shared/notification/useNotification";
import ProviderKeyList from "../enterprise/portal/id/providerKeyList";
import CreateProviderKeyModal from "../vault/createProviderKeyModal";
import { useVaultPage } from "../vault/useVaultPage";
import { ORGANIZATION_COLORS, ORGANIZATION_ICONS } from "./orgConstants";
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "react-i18next";
import useOnboardingContext from "@/components/layout/onboardingContext";
import { Loader2, X } from "lucide-react";

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
    referral?: string;
  };
  firstOrg?: boolean;
  onSuccess?: (param?: string) => void;
  onCloseHandler?: () => void;
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
    firstOrg,
    onCloseHandler,
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

  const [referralType, setReferralType] = useState(
    initialValues?.referral || "friend_referral"
  );

  const user = useUser();
  const orgContext = useOrg();
  const { setNotification } = useNotification();
  const [providerKey, setProviderKey] = useState(
    initialValues?.providerKey || ""
  );

  const { refetchProviderKeys } = useVaultPage();

  const [isProviderOpen, setIsProviderOpen] = useState(false);

  const { t } = useTranslation();
  const referralOptions = [
    { value: "friend_referral", label: t("Friend (referral)") },
    { value: "google", label: t("Google") },
    { value: "twitter", label: t("Twitter") },
    { value: "linkedin", label: t("LinkedIn") },
    { value: "microsoft_startups", label: t("Microsoft for Startups") },
    { value: "product_hunt", label: t("Product Hunt") },
    { value: "other", label: t("Other") },
  ];

  const { isOnboardingComplete } = useOnboardingContext();
  const [loading, setLoading] = useState(false);
  return (
    <>
      <div className="relative">
        {initialValues || variant === "reseller" ? (
          <></>
        ) : (
          <>
            <DialogHeader className="space-y-2">
              <DialogTitle>
                {firstOrg
                  ? "Get Started with Helicone"
                  : "Create New Organization"}
              </DialogTitle>
            </DialogHeader>
          </>
        )}
        {/* {!(firstOrg && isOnboardingComplete) && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 top-0"
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
          >
            <X className="h-4 w-4" />
          </Button>
        )} */}
        <div className="flex flex-col w-full space-y-6 mt-8">
          <div className="space-y-1.5 text-sm">
            <Label htmlFor="org-name">
              {
                {
                  organization: "Organization Name",
                  reseller: "Customer Name",
                }[variant]
              }
            </Label>
            <Input
              type="text"
              name="org-name"
              id="org-name"
              value={orgName}
              placeholder={
                variant === "organization" ? "ACME" : "Customer name"
              }
              onChange={(e) => setOrgName(e.target.value)}
            />
          </div>
          {variant === "reseller" && (
            <>
              <div>
                <label
                  htmlFor="org-limits"
                  className="block text-sm font-medium leading-6 text-slate-900 dark:text-slate-100"
                >
                  Limits
                </label>
                <div className="flex flex-row mx-auto gap-4">
                  <div className="space-y-1 text-sm">
                    <label
                      htmlFor="org-costs"
                      className="block text-xs leading-6 text-slate-500 "
                    >
                      Costs (USD)
                    </label>
                    <div className="flex flex-col gap-2">
                      <input
                        type="number"
                        name="org-costs"
                        id="org-costs"
                        disabled={limits?.cost !== -1}
                        value={
                          limits?.cost === -1 ? 9999999 : limits?.cost ?? 0
                        }
                        className={clsx(
                          "max-w-[10em] bg-slate-50 dark:bg-slate-950",
                          " block w-full rounded-md border-0 py-1.5",
                          "shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2",
                          "focus:ring-inset focus:ring-slate-600 text-sm lg:text-md lg:leading-6",
                          limits?.cost === -1
                            ? "text-slate-400"
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
                      className="block text-xs leading-6 text-slate-500 "
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
                          "max-w-[10em] bg-slate-50 dark:bg-slate-950",
                          " block w-full rounded-md border-0 py-1.5",
                          "shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2",
                          "focus:ring-inset focus:ring-slate-600 text-sm lg:text-md lg:leading-6",
                          limits?.requests === -1
                            ? "text-slate-400"
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
                      className="block text-xs leading-6 text-slate-500"
                    >
                      Time Grain
                    </label>
                    <select
                      id="org-size"
                      name="org-size"
                      className="max-w-[10em] bg-slate-50 dark:bg-slate-950 text-black dark:text-white block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-slate-600 text-sm lg:text-md lg:leading-6"
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
          <DialogFooter>
            {firstOrg && (
              <Button
                variant="outline"
                onClick={() => {
                  onCancelHandler?.(false);
                }}
              >
                Go Back
              </Button>
            )}
            <Button
              disabled={loading}
              className="w-full"
              onClick={async () => {
                setLoading(true);
                if ((user?.email ?? "") === DEMO_EMAIL) {
                  setNotification(
                    "Cannot create organization in demo mode",
                    "error"
                  );
                  return;
                }
                if (!orgName || orgName === "") {
                  setNotification(
                    "Please provide an organization name",
                    "error"
                  );
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
                  const { error: createOrgError, data } = await jawn.POST(
                    "/v1/organization/create",
                    {
                      body: {
                        name: orgName,
                        owner: user?.id!,
                        color: selectedColor.name,
                        icon: selectedIcon.name,
                        has_onboarded: !firstOrg,
                        tier: "free",
                        ...(variant === "reseller" && {
                          org_provider_key: providerKey,
                          limits: limits || undefined,
                          reseller_id: orgContext?.currentOrg?.id!,
                          organization_type: "customer",
                        }),
                        ...(firstOrg && {
                          referral: referralType,
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
                    orgContext?.refetchOrgs();
                    onSuccess && onSuccess(data?.data ?? "");
                    onCloseHandler && onCloseHandler();
                  }
                }
              }}
            >
              {initialValues
                ? loading
                  ? "Updating..."
                  : "Update"
                : loading
                ? "Loading..."
                : "Continue"}
              {loading && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
            </Button>
          </DialogFooter>
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
