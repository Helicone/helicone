import { useState } from "react";

import { RenderMappedRequest } from "@/components/templates/requests/RenderHeliconeRequest";
import { MappedLLMRequest } from "@helicone-package/llm-mapper/types";
import { Square2StackIcon } from "@heroicons/react/24/outline";
import RequestRow from "./requestRow";

interface RequestRowViewProps {
  rows: MappedLLMRequest[];
  properties: string[];
}

const RequestRowView = (props: RequestRowViewProps) => {
  const { rows, properties } = props;

  const [selectedRow, setSelectedRow] = useState<MappedLLMRequest | null>(null);

  return (
    <div className="relative flex w-full flex-row gap-4">
      <ul className="sticky top-[5vh] flex h-full w-full max-w-md flex-col divide-y divide-gray-300 overflow-auto dark:divide-gray-700">
        {rows.map((row, i) => (
          <RequestRow
            key={i}
            index={i}
            length={rows.length}
            isSelected={selectedRow?.id === row.id}
            row={row}
            onSelectRow={(row: MappedLLMRequest) => {
              setSelectedRow(row);
            }}
            properties={properties}
          />
        ))}
      </ul>
      {selectedRow ? (
        <div className="flex h-full w-full flex-col space-y-2 overflow-auto">
          <RenderMappedRequest mappedRequest={selectedRow} />
        </div>
      ) : (
        <div className="flex h-screen w-full flex-col items-center justify-center space-y-4 rounded-lg border border-gray-300 bg-white dark:border-gray-700 dark:bg-black">
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
