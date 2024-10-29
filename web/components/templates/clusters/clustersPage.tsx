import { useOrg } from "@/components/layout/organizationContext";
import useClustersPage, { useRequest } from "./useClustersPage";
import dynamic from "next/dynamic";
import { useState } from "react";
import RequestDiv from "../requestsV2/requestDiv";
import ThemedDrawer from "@/components/shared/themed/themedDrawer";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useGetRequestsByIdsWithBodies } from "@/services/hooks/requests";
import LoadingAnimation from "@/components/shared/loadingAnimation";
import { getInitialColumns } from "../requestsV2/initialColumns";
import ThemedTable from "@/components/shared/themed/table/themedTable";

const Plot = dynamic(() => import("react-plotly.js"), {
  ssr: false,
  loading: () => <>Loading...</>,
});

const ClustersPage = () => {
  const orgContext = useOrg();
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
    null
  );
  const { clusters, isLoading } = useClustersPage(
    orgContext?.currentOrg?.id || ""
  );
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);

  const {
    request,
    isLoading: isRequestLoading,
    updatedRequest,
    normalizedRequest,
  } = useRequest(selectedRequestId || "");

  const [open, setOpen] = useState(false);

  const {
    normalizedRequests: requestsByCluster,
    isLoading: isRequestsLoading,
  } = useGetRequestsByIdsWithBodies(
    clusters
      .filter((c) => c?.cluster === selectedCluster)
      .map((c) => c?.request_id ?? "")
  );

  // Get unique cluster values
  const uniqueClusters = clusters.reduce(
    (acc: (string | number | undefined)[], curr) => {
      if (curr?.cluster !== undefined && !acc.includes(curr.cluster)) {
        acc.push(curr.cluster satisfies string);
      }
      return acc;
    },
    []
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen w-full">
        Gathering clusters from your data... This may take a few minutes.
      </div>
    );
  }

  console.log({
    requestIds: clusters.filter((c) => c?.cluster === selectedCluster),
  });

  const defaultColumns = getInitialColumns();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex">
        <div className="w-1/3">
          {uniqueClusters.map((cluster) => (
            <Card
              key={cluster}
              onClick={() => {
                console.log("clicked", cluster);
                setSelectedCluster(cluster as string);
              }}
              className="cursor-pointer rounded-none"
            >
              <CardHeader>{cluster}</CardHeader>
            </Card>
          ))}
        </div>
        <Plot
          className="w-2/3"
          data={uniqueClusters.map((cluster) => ({
            x: clusters
              .filter((c) => c?.cluster === cluster)
              .map((c) => c?.x ?? 0),
            y: clusters
              .filter((c) => c?.cluster === cluster)
              .map((c) => c?.y ?? 0),
            type: "scattergl",
            mode: "markers",
            hovertext: clusters
              .filter((c) => c?.cluster === cluster)
              .map((c) => c?.request_id ?? ""),
          }))}
          onClick={(data) => {
            console.log(data);
            // @ts-ignore
            if (data.points?.[0]?.hovertext) {
              setOpen(true);
              // @ts-ignore
              setSelectedRequestId(data.points[0].hovertext ?? null);
            }
          }}
          layout={{
            title: "Clusters",
            plot_bgcolor: "transparent",
            paper_bgcolor: "transparent",
          }}
        />
      </div>

      {isRequestsLoading && <LoadingAnimation />}

      <ThemedTable
        id="requests-table-clusters"
        defaultColumns={defaultColumns}
        defaultData={requestsByCluster}
        skeletonLoading={false}
        dataLoading={isRequestsLoading}
        // skeletonLoading={}
        // dataLoading={isRequestsLoading}
      />

      {open && (
        <ThemedDrawer open={open} setOpen={setOpen}>
          <RequestDiv
            open={open}
            setOpen={setOpen}
            request={normalizedRequest}
            properties={[]}
            hasPrevious={false}
            hasNext={false}
            onPrevHandler={() => {}}
            onNextHandler={() => {}}
          />
        </ThemedDrawer>
      )}
    </div>
  );
};

export default ClustersPage;
