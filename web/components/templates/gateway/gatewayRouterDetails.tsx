import MarkdownEditor from "@/components/shared/markdownEditor";
import { $JAWN_API } from "@/lib/clients/jawn";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import yaml from "js-yaml";
import { Button } from "@/components/ui/button";

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

  return (
    <div>
      GatewayRouterPage {router_id} {JSON.stringify(gatewayRouter)}
      <MarkdownEditor
        monaco
        text={config}
        setText={(value) => setConfig(value)}
        disabled={false}
        language="yaml"
        monacoOptions={{
          lineNumbers: "on",
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
    </div>
  );
};

export default GatewayRouterPage;
