import { useOrg } from "@/components/layout/organizationContext";
import useClustersPage, { useRequest } from "./useClustersPage";
import dynamic from "next/dynamic";
import { useState } from "react";
import RequestDiv from "../requestsV2/requestDiv";
import ThemedDrawer from "@/components/shared/themed/themedDrawer";

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
  const {
    request,
    isLoading: isRequestLoading,
    updatedRequest,
    normalizedRequest,
  } = useRequest(selectedRequestId || "");

  const [open, setOpen] = useState(false);

  // Get unique cluster values
  const uniqueClusters = clusters.reduce(
    (acc: (string | number | undefined)[], curr) => {
      if (curr?.cluster !== undefined && !acc.includes(curr.cluster)) {
        acc.push(curr.cluster);
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

  return (
    <div className="flex flex-col gap-4">
      <h1>Clusters</h1>
      <Plot
        data={[
          {
            x: clusters.map((c) => c?.x ?? 0),
            y: clusters.map((c) => c?.y ?? 0),
            type: "scatter",
            mode: "markers",
            text: clusters.map((c) => c?.cluster ?? ""),
            marker: {
              size: 10,
              color: clusters.map((c) => c?.cluster ?? 0),
            },
            hovertext: clusters.map((c) => c?.request_id ?? ""),
          },
        ]}
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
        }}
      />

      <div>
        <h2>Clusters</h2>
        {uniqueClusters.join(", ")}
      </div>

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
