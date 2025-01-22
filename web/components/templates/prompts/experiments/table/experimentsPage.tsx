import { useOrg } from "@/components/layout/org/organizationContext";
import { FeatureUpgradeCard } from "@/components/shared/helicone/FeatureUpgradeCard";
import { UpgradeToProCTA } from "@/components/templates/pricing/upgradeToProCTA";
import { DiffHighlight } from "@/components/templates/welcome/diffHighlight";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InfoBox } from "@/components/ui/helicone/infoBox";
import { ChevronDownIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useMemo, useState } from "react";
import { useJawnClient } from "../../../../../lib/clients/jawnHook";
import { useExperimentTables } from "../../../../../services/hooks/prompts/experiments";
import { usePrompts } from "../../../../../services/hooks/prompts/prompts";
import AuthHeader from "../../../../shared/authHeader";
import useNotification from "../../../../shared/notification/useNotification";
import ThemedTable from "../../../../shared/themed/table/themedTable";
import { Dialog } from "../../../../ui/dialog";
import { StartFromPromptDialog } from "./components/startFromPromptDialog";

const ExperimentsPage = () => {
  const jawn = useJawnClient();
  const notification = useNotification();
  const { prompts } = usePrompts();
  const [dialogOpen, setDialogOpen] = useState(false);
  const router = useRouter();
  const { experiments, isLoading } = useExperimentTables();

  const org = useOrg();

  const hasAccess = useMemo(() => {
    return (
      org?.currentOrg?.tier === "growth" ||
      org?.currentOrg?.tier === "enterprise" ||
      org?.currentOrg?.tier === "pro" ||
      org?.currentOrg?.tier === "demo" ||
      (org?.currentOrg?.tier === "pro-20240913" &&
        (org?.currentOrg?.stripe_metadata as { addons?: { prompts?: boolean } })
          ?.addons?.prompts)
    );
  }, [org?.currentOrg?.tier, org?.currentOrg?.stripe_metadata]);

  const { setNotification } = useNotification();

  return (
    <>
      <AuthHeader
        title={"Experiments"}
        actions={
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
                    router.push(`/experiments/${res.data?.data?.experimentId}`);
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
          <FeatureUpgradeCard
            title="Unlock Experiments"
            description="The Free plan does not include the Experiments feature, but getting access is easy."
            infoBoxText="You will be charged the cost of the LLM calls made in your experiments." // TODO: change copy
            documentationLink="https://docs.helicone.ai/features/experiments"
            tier={org?.currentOrg?.tier ?? "free"}
          />
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
        <>
          <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
            <Card className="max-w-4xl">
              <CardHeader>
                <CardTitle>Unlock Experiment Features</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Take your LLM development to the next level with
                  Helicone&apos;s powerful experimentation tools. Compare
                  models, test prompts, and optimize outputs with data-driven
                  insights.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <InfoBox>
                  <p className="text-sm font-medium">
                    Run A/B tests on prompts, evaluate performance, and make
                    data-driven decisions to improve your AI outputs. Test
                    safely with production data without impacting users.
                  </p>
                </InfoBox>
                <div className="bg-muted p-4 rounded-lg space-y-3">
                  <div className="text-sm text-muted-foreground">
                    <ul className="list-disc pl-4 space-y-1">
                      <li>Run experiments with real production data</li>
                      <li>Compare multiple prompt versions</li>
                      <li>Score and evaluate outputs</li>
                      <li>Safe testing without user impact</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col items-center">
                <div className="w-full">
                  <UpgradeToProCTA
                    defaultPrompts={true}
                    showAddons={true}
                    showContactCTA={true}
                  />
                </div>
                <div className="space-x-2 mt-5">
                  <Button variant="outline" asChild>
                    <Link href="https://docs.helicone.ai/features/prompts#prompts-and-experiments">
                      View documentation
                    </Link>
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </div>
        </>
      )}
    </>
  );
};

export default ExperimentsPage;
