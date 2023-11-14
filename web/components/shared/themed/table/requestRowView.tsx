import { useState } from "react";
import { NormalizedRequest } from "../../../templates/requestsV2/builder/abstractRequestBuilder";
import StatusBadge from "../../../templates/requestsV2/statusBadge";
import ModelPill from "../../../templates/requestsV2/modelPill";
import { formatNumber } from "../../../templates/users/initialColumns";
import { getUSDate } from "../../utils/utils";
import { clsx } from "../../clsx";
import LoadingAnimation from "../../loadingAnimation";
import {
  ChevronRightIcon,
  Square2StackIcon,
} from "@heroicons/react/24/outline";
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
    <div className="flex flex-row gap-4 relative h-full">
      <ul className="h-auto w-full max-w-md flex flex-col divide-y divide-gray-300 dark:divide-gray-700">
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

      {selectedRow ? (
        <div className="w-full">{selectedRow.render}</div>
      ) : (
        <div className="flex flex-col space-y-4 justify-center items-center h-[75vh] w-full bg-white border border-gray-300 dark:bg-black dark:border-gray-700 rounded-lg">
          <Square2StackIcon className="h-12 w-12 text-gray-500" />
          <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Select a row to view
          </p>
        </div>
      )}
    </div>
  );
};

export default RequestRowView;
