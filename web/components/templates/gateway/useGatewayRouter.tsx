import { $JAWN_API } from "@/lib/clients/jawn";
import { useMutation } from "@tanstack/react-query";

const useGatewayRouter = ({ routerId }: { routerId: string }) => {
  const { data: gatewayRouter, isLoading } = $JAWN_API.useQuery(
    "get",
    `/v1/gateway/{id}`,
    {
      params: {
        path: {
          id: routerId,
        },
      },
    },
  );

  const { mutate: updateGatewayRouter, isPending: isUpdatingGatewayRouter } =
    $JAWN_API.useMutation("put", `/v1/gateway/{id}`);
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

  return {
    gatewayRouter,
    isLoading,
    updateGatewayRouter,
    isUpdatingGatewayRouter,
    validateRouterConfig,
  };
};

export default useGatewayRouter;
