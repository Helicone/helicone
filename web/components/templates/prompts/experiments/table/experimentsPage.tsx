import { useOrg } from "@/components/layout/org/organizationContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDownIcon } from "lucide-react";
import { useRouter } from "next/router";
import { useState } from "react";
import { useJawnClient } from "../../../../../lib/clients/jawnHook";
import { useExperimentTables } from "../../../../../services/hooks/prompts/experiments";
import { usePrompts } from "../../../../../services/hooks/prompts/prompts";
import AuthHeader from "../../../../shared/authHeader";
import useNotification from "../../../../shared/notification/useNotification";
import ThemedTable from "../../../../shared/themed/table/themedTable";
import { Dialog } from "../../../../ui/dialog";
import { StartFromPromptDialog } from "./components/startFromPromptDialog";
import ExperimentsPreview from "@/components/templates/featurePreview/experimentsPreview";
import { useHasAccess } from "@/hooks/useHasAccess";

const ExperimentsPage = () => {
  const jawn = useJawnClient();
  const notification = useNotification();
  const { prompts } = usePrompts();
  const [dialogOpen, setDialogOpen] = useState(false);
  const router = useRouter();
  const { experiments, isLoading } = useExperimentTables();
  const org = useOrg();
  const hasAccess = useHasAccess("experiments");

  const { setNotification } = useNotification();

  return (
    <>
      <AuthHeader
        title={hasAccess ? "Experiments" : null}
        actions={
          hasAccess ? (
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  Start new experiment
                  <ChevronDownIcon className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-[200px]">
                <DropdownMenuItem
                  onSelect={async () => {
                    setNotification("Creating experiment...", "info");
                    const res = await jawn.POST("/v2/experiment/create/empty");
                    if (res.error) {
                      notification.setNotification(
                        "Failed to create experiment",
                        "error"
                      );
                    } else {
                      router.push(
                        `/experiments/${res.data?.data?.experimentId}`
                      );
                    }
                  }}
                >
                  Start from scratch
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setDialogOpen(true)}>
                  Start from prompt
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null
        }
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <StartFromPromptDialog
          prompts={prompts as any}
          onDialogClose={() => setDialogOpen(false)}
        />
      </Dialog>

      {org?.currentOrg?.tier === "free" ? (
        <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
          <ExperimentsPreview />
        </div>
      ) : hasAccess ? (
        <>
          <ThemedTable
            defaultColumns={[
              {
                header: "Name",
                accessorFn: (row) => {
                  return row.name;
                },
              },
              {
                header: "Created At",
                accessorKey: "created_at",
                minSize: 100,
                accessorFn: (row) => {
                  return new Date(row.created_at ?? 0).toLocaleString();
                },
              },
            ]}
            defaultData={experiments}
            dataLoading={isLoading}
            id="experiments"
            skeletonLoading={false}
            onRowSelect={(row) => {
              const promptId = row.original_prompt_version;
              if (promptId) {
                router.push(`/experiments/${row.id}`);
              }
            }}
            fullWidth={true}
          />
        </>
      ) : (
        <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
          <ExperimentsPreview />
        </div>
      )}
    </>
  );
};

export default ExperimentsPage;
