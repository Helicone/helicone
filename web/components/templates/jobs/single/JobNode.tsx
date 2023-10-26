import { memo, useState } from "react";
import { Handle, Position } from "reactflow";
import { HeliconeNode } from "../../../../lib/api/graphql/client/graphql";
import ThemedTableV5 from "../../../shared/themed/table/themedTableV5";
import { NormalizedRequest } from "../../requestsV2/builder/abstractRequestBuilder";
import RequestDrawerV2 from "../../requestsV2/requestDrawerV2";
import useRequestsPageV2 from "../../requestsV2/useRequestsPageV2";
import { getInitialColumns } from "./initialColumns";

function JobNodeInner({ task }: { task: HeliconeNode }) {
  const { requests, properties } = useRequestsPageV2(
    1,
    25,
    [],
    {
      request: {
        node_id: {
          equals: task.id,
        },
      },
    },
    {
      created_at: "desc",
    },
    false,
    false
  );

  const columnsWithProperties = getInitialColumns(false);
  const [open, setOpen] = useState(false);
  const [selectedData, setSelectedData] = useState<
    NormalizedRequest | undefined
  >(undefined);

  const onRowSelectHandler = (row: NormalizedRequest) => {
    setOpen(true);

    setSelectedData(row);
  };

  return (
    <>
      <ThemedTableV5
        defaultData={requests || []}
        defaultColumns={columnsWithProperties}
        dataLoading={false}
        tableKey="requestsColumnNodeVisibility"
        hideView={true}
        onRowSelect={(row) => {
          onRowSelectHandler(row);
        }}
      />
      <RequestDrawerV2
        open={open}
        setOpen={setOpen}
        request={selectedData}
        properties={properties}
      />
    </>
  );
}

function JobNode({
  id,
  data,
  isConnectable,
}: {
  id: string;
  data: {
    node: HeliconeNode;
  };
  isConnectable?: boolean;
}) {
  return (
    <>
      <div className="p-8 bg-white rounded-2xl flex flex-col space-y-4 border border-gray-300">
        <div className="flex flex-col space-y-1">
          <p className="text-xl font-semibold text-gray-900">
            {data.node.name}
          </p>
          {data.node.description && (
            <p className="text-sm text-gray-600">{data.node.description}</p>
          )}
        </div>
        <JobNodeInner task={data.node} />
      </div>

      <Handle
        type="target"
        position={Position.Left}
        style={{ background: "#555" }}
        onConnect={(params) => console.log("handle onConnect", params)}
        isConnectable={isConnectable}
      />

      <Handle
        type="source"
        position={Position.Right}
        id="a"
        style={{ background: "#555" }}
        isConnectable={isConnectable}
      />
    </>
  );
}

export default memo(JobNode);
