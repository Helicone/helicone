import { useOrg } from "@/components/layout/org/organizationContext";
import FoldedHeader from "@/components/shared/FoldedHeader";
import MarkdownEditor from "@/components/shared/markdownEditor";
import useNotification from "@/components/shared/notification/useNotification";
import { Button } from "@/components/ui/button";
import { Muted, Small } from "@/components/ui/typography";
import { $JAWN_API } from "@/lib/clients/jawn";
import { useFeatureFlag } from "@/services/hooks/admin";
import { useMutation } from "@tanstack/react-query";
import yaml from "js-yaml";
import { CopyIcon, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const GatewayRouterPage = () => {
  const router = useRouter();
  const { router_id } = router.query;
  const { data: gatewayRouter, isLoading } = $JAWN_API.useQuery(
    "get",
    `/v1/gateway/{id}`,
    {
      params: {
        path: {
          id: router_id as string,
        },
      },
    },
  );

  const [config, setConfig] = useState<string>("");

  useEffect(() => {
    if (gatewayRouter) {
      const yamlString = yaml.dump(gatewayRouter.data?.config);
      setConfig(yamlString);
    }
  }, [gatewayRouter]);

  const { mutate: updateGatewayRouter, isPending } = $JAWN_API.useMutation(
    "put",
    `/v1/gateway/{id}`,
  );
  const { mutateAsync: validateRouterConfig } = useMutation({
    mutationFn: async (config: unknown) => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_CLOUD_GATEWAY_BASE_URL}/validate-router-config`,
          {
            method: "POST",
            body: JSON.stringify(config),
            headers: {
              "Content-Type": "application/json",
            },
          },
        );
        const data = await response.json();
        if (response.ok && "valid" in data) {
          return {
            valid: !!data.valid,
          };
        }
        return {
          error: "Failed to validate router config",
        };
      } catch (error) {
        console.error(error);
        return {
          error: "Failed to validate router config",
        };
      }
    },
  });
  const { setNotification } = useNotification();

  const handleConfigSave = async () => {
    const obj = yaml.load(config);

    const result = await validateRouterConfig(obj);
    console.log(result);
    if (!result.valid || result.error) {
      setNotification("Invalid router config", "error");
      return;
    }

    updateGatewayRouter({
      params: {
        path: {
          id: router_id as string,
        },
      },
      body: {
        name: gatewayRouter?.data?.name ?? "",
        config: JSON.stringify(obj),
      },
    });
  };

  const org = useOrg();
  const { data: hasFeatureFlag } = useFeatureFlag(
    "ai_gateway",
    org?.currentOrg?.id ?? "",
  );

  if (!hasFeatureFlag?.data) {
    return <div>You do not have access to the AI Gateway</div>;
  }

  return (
    <main className="flex h-screen w-full animate-fade-in flex-col">
      <FoldedHeader
        showFold={false}
        leftSection={
          <div className="flex flex-row items-center gap-4">
            <div className="flex flex-row items-center gap-1">
              <Link href="/gateway" className="no-underline">
                <Small className="font-semibold">AI Gateway</Small>
              </Link>
              <Small className="font-semibold">/</Small>
              <Link href={`/gateway/${router_id}`} className="no-underline">
                <Muted className="text-sm">
                  {gatewayRouter?.data?.name || gatewayRouter?.data?.hash}
                </Muted>
              </Link>
            </div>
          </div>
        }
      />
      <div className="flex items-center gap-2">
        <div className="text-sm text-muted-foreground">Router Hash</div>
        <div className="text-sm text-muted-foreground">
          {gatewayRouter?.data?.hash}
        </div>
        <Button
          variant="ghost"
          size="sm_sleek"
          className="text-muted-foreground"
          onClick={() => {
            navigator.clipboard.writeText(gatewayRouter?.data?.hash ?? "");
            setNotification("Copied to clipboard", "success");
          }}
        >
          <CopyIcon className="h-3 w-3" />
        </Button>
      </div>
      <MarkdownEditor
        monaco
        text={config}
        setText={(value) => setConfig(value)}
        disabled={false}
        language="yaml"
        monacoOptions={{
          lineNumbers: "on",
          tabSize: 2,
        }}
      />
      <div className="flex flex-col gap-2">
        <Button disabled={!config || isPending} onClick={handleConfigSave}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
        </Button>
      </div>
    </main>
  );
};

export default GatewayRouterPage;
