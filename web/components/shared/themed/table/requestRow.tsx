import { ChevronRightIcon } from "@heroicons/react/20/solid";
import { NormalizedRequest } from "../../../templates/requestsV2/builder/abstractRequestBuilder";
import ModelPill from "../../../templates/requestsV2/modelPill";
import StatusBadge from "../../../templates/requestsV2/statusBadge";
import { formatNumber } from "../../../templates/users/initialColumns";
import { clsx } from "../../clsx";
import { useState } from "react";
import { Transition } from "@headlessui/react";

interface RequestRowProps {
  index: number;
  length: number;
  isSelected: boolean;
  row: NormalizedRequest;
  onSelectRow: (row: NormalizedRequest) => void;
  properties: string[];
}

const RequestRow = (props: RequestRowProps) => {
  const { index, length, isSelected, row, onSelectRow, properties } = props;

  return (
    <li
      key={"request-row-view-" + index}
      className={clsx(
        index === length - 1 && "rounded-b-lg border-b",
        index === 0 && "rounded-t-lg border-t",
        isSelected ? "bg-gray-100" : "bg-white",
        isSelected && "sticky top-0 bottom-0 ring-1 ring-gray-500 shadow-md",
        "flex flex-col space-y-4 w-full p-4 border-l border-r border-gray-300 hover:bg-gray-50 hover:cursor-pointer"
      )}
      onClick={() => onSelectRow(row)}
    >
      <div className="flex flex-row space-x-4 items-center">
        <p className="text-sm font-semibold">
          {new Date(row.createdAt).toLocaleString()}
        </p>
        <StatusBadge
          statusType={row.status.statusType}
          errorCode={row.status.code}
        />
      </div>
      <div className="flex flex-row justify-between items-center">
        <div className="flex flex-row gap-4 items-center">
          <ModelPill model={row.model} />
          <p className="text-xs font-semibold">{Number(row.latency) / 1000}s</p>
          <p className="text-xs font-semibold">{`$${formatNumber(
            row.cost || 0
          )}`}</p>
        </div>

        <ChevronRightIcon
          className={clsx(
            isSelected && "transform rotate-90",
            "h-4 w-4 text-gray-500"
          )}
        />
      </div>

      {isSelected && (
        <div className="flex flex-col space-y-4">
          <p className="text-sm">
            <span className="font-semibold">User:</span> {row.user}
          </p>
          <p className="text-sm">
            <span className="font-semibold">Total Tokens:</span>{" "}
            {row.totalTokens}{" "}
            <span className="text-gray-600 text-xs">
              (Completion: {row.completionTokens} / Prompt: {row.promptTokens})
            </span>
          </p>
          {row.customProperties &&
            properties.length > 0 &&
            Object.keys(row.customProperties).length > 0 && (
              <>
                {properties.map((property, i) => {
                  if (
                    row.customProperties &&
                    row.customProperties.hasOwnProperty(property)
                  ) {
                    return (
                      <p className="text-sm" key={i}>
                        <span className="font-semibold">{property}:</span>{" "}
                        {row.customProperties[property] as string}
                      </p>
                    );
                  }
                })}
              </>
            )}
        </div>
      )}
    </li>
  );
};

export default RequestRow;
