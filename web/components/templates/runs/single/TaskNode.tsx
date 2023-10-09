import React, { memo, useEffect, useState } from "react";
import { Handle, useReactFlow, useStoreApi, Position } from "reactflow";
import { HeliconeNode } from "../../../../lib/api/graphql/client/graphql";
import { useGetRequests } from "../../../../services/hooks/requests";
import ThemedTableV5 from "../../../shared/themed/table/themedTableV5";
import { getInitialColumns } from "./initialColumns";
import { useGetProperties } from "../../../../services/hooks/properties";
import useRequestsPageV2 from "../../requestsV2/useRequestsPageV2";
import RequestDrawerV2 from "../../requestsV2/requestDrawerV2";
import { NormalizedRequest } from "../../requestsV2/builder/abstractRequestBuilder";

function TaskNodeInner({ task }: { task: HeliconeNode }) {
  const { requests, properties } = useRequestsPageV2(
    1,
    25,
    [],
    {
      request: {
        task_id: {
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
    <div className="">
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
    </div>
  );
}

function TaskNode({
  id,
  data,
  isConnectable,
}: {
  id: string;
  data: {
    task: HeliconeNode;
  };
  isConnectable?: boolean;
}) {
  return (
    <>
      <div className="p-10 bg-white">
        <div>{data.task.name}</div>
        <TaskNodeInner task={data.task} />
      </div>

      <Handle
        type="target"
        position={Position.Left}
        style={{ background: "#555" }}
        onConnect={(params) => console.log("handle onConnect", params)}
        isConnectable={isConnectable}
      />
      {/* <div>{JSON.stringify(data)}</div> */}

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

export default memo(TaskNode);
