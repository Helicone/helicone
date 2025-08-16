import { $JAWN_API } from "@/lib/clients/jawn";
import { useMutation } from "@tanstack/react-query";
import { logger } from "@/lib/telemetry/logger";

const useGatewayRouter = ({ routerHash }: { routerHash: string }) => {
  const { data: gatewayRouter, isLoading } = $JAWN_API.useQuery(
    "get",
    `/v1/gateway/{routerHash}`,
    {
      params: {
        path: {
          routerHash,
        },
      },
    },
  );

  const { mutate: updateGatewayRouter, isPending: isUpdatingGatewayRouter } =
    $JAWN_API.useMutation("put", `/v1/gateway/{routerHash}`);
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
            ...("error" in data ? { error: data.error } : {}),
          };
        }
        return {
          error: "Failed to validate router config",
        };
      } catch (error) {
        logger.error({ error }, "Failed to validate router config");
        return {
          error: "Failed to validate router config",
        };
      }
    },
  });

  return {
    gatewayRouter,
    isLoading,
    updateGatewayRouter,
    isUpdatingGatewayRouter,
    validateRouterConfig,
  };
};

export default useGatewayRouter;
