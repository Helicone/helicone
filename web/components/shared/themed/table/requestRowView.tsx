import { useState } from "react";
import { NormalizedRequest } from "../../../templates/requestsV2/builder/abstractRequestBuilder";
import StatusBadge from "../../../templates/requestsV2/statusBadge";
import ModelPill from "../../../templates/requestsV2/modelPill";
import { formatNumber } from "../../../templates/users/initialColumns";
import { getUSDate } from "../../utils/utils";
import { clsx } from "../../clsx";
import LoadingAnimation from "../../loadingAnimation";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import RequestRow from "./requestRow";

interface RequestRowViewProps {
  rows: NormalizedRequest[];
  properties: string[];
}

const RequestRowView = (props: RequestRowViewProps) => {
  const { rows, properties } = props;

  const [selectedRow, setSelectedRow] = useState<NormalizedRequest | null>(
    null
  );

  return (
    <div className="flex flex-row gap-4 relative">
      <ul className="h-full w-full max-w-md flex flex-col bg-white divide-y divide-gray-300 border border-gray-300 rounded-lg">
        {rows.map((row, i) => (
          <RequestRow
            key={i}
            index={i}
            length={rows.length}
            isSelected={selectedRow?.id === row.id}
            row={row}
            onSelectRow={(row: NormalizedRequest) => {
              setSelectedRow(row);
            }}
            properties={properties}
          />
        ))}
      </ul>
      <div className="h-full w-full bg-white p-4 rounded-lg border border-gray-300">
        {selectedRow ? (
          <div>{selectedRow.render}</div>
        ) : (
          <div className="flex justify-center items-center h-[70vh]">
            <LoadingAnimation title="Select a row to view" />
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestRowView;
