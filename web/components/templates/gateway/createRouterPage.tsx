import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { $JAWN_API } from "@/lib/clients/jawn";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import * as yaml from "js-yaml";
import useNotification from "@/components/shared/notification/useNotification";
import { useRouter } from "next/router";
import { InfoIcon, PlusIcon } from "lucide-react";
import MarkdownEditor from "@/components/shared/markdownEditor";
import { H3, Small } from "@/components/ui/typography";
import FoldedHeader from "@/components/shared/FoldedHeader";
import { useFeatureFlag } from "@/services/hooks/admin";
import { useOrg } from "@/components/layout/org/organizationContext";
import { logger } from "@/lib/telemetry/logger";
import Link from "next/link";
import RouterConfigForm from "./RouterConfigForm";
import { useRouterConfig } from "./useRouterConfig";

const CreateRouterPage = () => {
  const org = useOrg();

  const { data: hasFeatureFlag } = useFeatureFlag(
    "ai_gateway",
    org?.currentOrg?.id ?? "",
  );

  const [name, setName] = useState("My Router");
  const [showGeneratedConfig, setShowGeneratedConfig] = useState(false);

  // Use the shared router config hook
  const { state, setState, generateYaml } = useRouterConfig();

  const queryClient = useQueryClient();
  const { setNotification } = useNotification();
  const router = useRouter();
  const { mutateAsync: createRouter, isPending } = $JAWN_API.useMutation(
    "post",
    "/v1/gateway",
  );

  const handleCreateRouter = async () => {
    if (!name) {
      setNotification("Router name is required", "error");
      return;
    }

    const generatedConfig = generateYaml();
    const obj = yaml.load(generatedConfig);

    try {
      const routerResponse = await createRouter({
        body: {
          name,
          config: JSON.stringify(obj),
        },
      });

      queryClient.invalidateQueries({ queryKey: ["get", "/v1/gateway"] });
      setNotification("Router created successfully", "success");

      // Redirect to the new router page
      router.push(
        `/gateway/${routerResponse?.data?.routerHash}?new-router=true`,
      );
    } catch (error) {
      setNotification("Failed to create router", "error");
      logger.error({ error }, "Error creating router");
    }
  };

  if (!hasFeatureFlag) {
    return <div>You do not have access to the AI Gateway</div>;
  }

  return (
    <main className="flex h-screen w-full animate-fade-in flex-col">
      <FoldedHeader
        showFold={false}
        leftSection={
          <Link href="/gateway">
            <Small className="font-bold text-gray-500 dark:text-slate-300">
              AI Gateway
            </Small>
          </Link>
        }
      />

      <div className="flex-1 overflow-y-auto p-6">
        <div>
          <H3>Create Router</H3>
          <Small className="mb-4 text-muted-foreground">
            Build a custom router with load balancing, caching, and rate
            limiting
          </Small>
          {/* Router Name Input */}
          <div className="space-y-2 py-2">
            <Label htmlFor="name">Router Name</Label>
            <Input
              id="name"
              placeholder="My Router"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="max-w-lg"
            />
            <div className="flex w-full items-center justify-end gap-1 text-xs text-muted-foreground">
              <InfoIcon className="h-3 w-3" />
              For more information about the configuration, see the{" "}
              <a
                target="_blank"
                rel="noreferrer"
                href="https://docs.helicone.ai/ai-gateway/config"
                className="text-blue-500 hover:underline"
              >
                documentation
              </a>
            </div>
          </div>

          {/* Configuration Form */}
          <RouterConfigForm state={state} onStateChange={setState} />

          {/* Generated Configuration Toggle */}
          <div className="flex justify-center py-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowGeneratedConfig(!showGeneratedConfig)}
            >
              {showGeneratedConfig ? "Hide" : "View"} Generated Configuration
            </Button>
          </div>

          {/* Generated Configuration Section */}
          {showGeneratedConfig && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                  Generated Configuration
                </Label>
              </div>
              <div className="rounded-lg border bg-muted p-3">
                <MarkdownEditor
                  text={generateYaml()}
                  disabled
                  setText={() => {}}
                  language="yaml"
                  monaco
                  monacoOptions={{
                    tabSize: 2,
                    lineNumbers: "on",
                  }}
                  className="font-mono text-sm"
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-end justify-end gap-3">
            <Button variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateRouter}
              disabled={isPending || !name.trim()}
            >
              {isPending ? (
                "Creating..."
              ) : (
                <>
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Create Router
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default CreateRouterPage;
