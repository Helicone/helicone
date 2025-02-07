import { useUser } from "@supabase/auth-helpers-react";
import { useState, useMemo } from "react";
import { useLocalStorage } from "../../../../services/hooks/localStorage";
import { Database } from "../../../../supabase/database.types";
import { Row } from "../../../layout/common";
import { clsx } from "../../../shared/clsx";
import CreateOrgForm from "../createOrgForm";
import { DeleteOrgModal } from "../deleteOrgModal";
import { useIsGovernanceEnabled } from "../hooks";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CopyIcon, TrashIcon } from "lucide-react";
import useNotification from "@/components/shared/notification/useNotification";

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
  const { setNotification } = useNotification();

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

  const handleCopy = (text: string, message: string) => {
    navigator.clipboard.writeText(text);
    setNotification(message, "success");
  };

  return (
    <>
      <div className="py-4 flex flex-col text-gray-900 dark:text-gray-100 w-full max-w-2xl gap-8">
        {isGovernanceEnabled.data?.data?.data && (
          <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10">
            <CardHeader>
              <CardTitle className="text-blue-900 dark:text-blue-100 text-lg">
                Organization Governance
              </CardTitle>
              <CardDescription className="text-blue-700 dark:text-blue-300">
                Managed by system administrator with $
                {totalUsage?.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                monthly spend limit
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm font-medium text-blue-800 dark:text-blue-200">
                <span>
                  $
                  {currentUsage.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                  <span className="text-xs text-blue-600/80 dark:text-blue-400/80 ml-1">
                    used
                  </span>
                </span>
                <span>
                  {isUnlimited
                    ? "Unlimited"
                    : `$${totalUsage.toLocaleString()} limit`}
                </span>
              </div>
              <Progress
                value={(currentUsage / totalUsage) * 100}
                className="h-2 bg-blue-200 dark:bg-blue-800"
                indicatorClassName={clsx(
                  isUnlimited
                    ? "bg-green-500"
                    : currentUsage / totalUsage > 0.9
                    ? "bg-red-500"
                    : currentUsage / totalUsage > 0.7
                    ? "bg-yellow-500"
                    : "bg-green-500"
                )}
              />
              <p className="text-xs text-blue-600 dark:text-blue-400">
                Usage resets every {days} days
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Organization Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Organization ID</Label>
              <div className="flex gap-2">
                <Input value={org.id} className="font-mono" readOnly />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleCopy(org.id, "Organization ID copied to clipboard")
                  }
                >
                  <CopyIcon className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Organization Name</Label>
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
            </div>
          </CardContent>
        </Card>

        {isOwner && (
          <Card className="border-destructive/20">
            <CardHeader>
              <CardTitle className="text-destructive text-lg">
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-4">
                <div className="text-sm text-destructive/90">
                  Deleting this organization will permanently remove all
                  associated data.
                </div>
                <Button
                  variant="destructive"
                  onClick={() => setDeleteOpen(true)}
                  className="w-fit"
                >
                  <TrashIcon className="h-4 w-4 mr-2" />
                  Delete Organization
                </Button>
              </div>
            </CardContent>
          </Card>
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
