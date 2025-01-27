import { useState } from "react";

import { RenderMappedRequest } from "@/components/templates/requests/RenderHeliconeRequest";
import { MappedLLMRequest } from "@/packages/cost/llm-mappers/types";
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
    <div className="flex flex-row gap-4 w-full relative h-[75vh]">
      <ul className="h-full overflow-auto sticky top-[5vh] w-full max-w-md flex flex-col divide-y divide-gray-300 dark:divide-gray-700">
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
        <div className="flex flex-col space-y-2 w-full h-full overflow-auto">
          <RenderMappedRequest mapperContent={selectedRow} />
        </div>
      ) : (
        <div className="flex flex-col space-y-4 justify-center items-center h-full w-full bg-white border border-gray-300 dark:bg-black dark:border-gray-700 rounded-lg">
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
