import FoldedHeader from "@/components/shared/FoldedHeader";
import MarkdownEditor from "@/components/shared/markdownEditor";
import useNotification from "@/components/shared/notification/useNotification";
import { Button } from "@/components/ui/button";
import { Muted, Small } from "@/components/ui/typography";
import { $JAWN_API } from "@/lib/clients/jawn";
import yaml from "js-yaml";
import { CopyIcon } from "lucide-react";
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

  const { mutate: updateGatewayRouter } = $JAWN_API.useMutation(
    "put",
    `/v1/gateway/{id}`,
  );
  const { setNotification } = useNotification();

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
        <Button
          onClick={() => {
            const obj = yaml.load(config);
            console.log(obj);
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
          }}
        >
          Save
        </Button>
      </div>
    </main>
  );
};

export default GatewayRouterPage;
