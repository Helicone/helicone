import {
  CodeBracketIcon,
  EyeIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { Tooltip } from "@mui/material";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import ThemedTabs from "../../shared/themed/themedTabs";
import { getUSDate } from "../../shared/utils/utils";
import { Completion } from "../requests/completion";
import { NormalizedRequest } from "./builder/abstractRequestBuilder";
import ModelPill from "./modelPill";
import StatusBadge from "./statusBadge";
import { clsx } from "../../shared/clsx";

function getPathName(url: string) {
  try {
    return new URL(url).pathname;
  } catch (e) {
    return url;
  }
}

export function RequestView(props: {
  request: NormalizedRequest;
  properties: string[];
  open?: boolean;
  wFull?: boolean;
}) {
  const { request, properties, open = true, wFull = false } = props;
  const [mode, setMode] = useState<"pretty" | "json">("pretty");
  const router = useRouter();

  // set the mode to pretty if the drawer closes, also clear the requestId
  useEffect(() => {
    if (!open) {
      setMode("pretty");
    }
  }, [open, router]);

  return (
    <div className="flex flex-col h-full space-y-8">
      <ul
        className={clsx(
          wFull && "2xl:grid-cols-4 2xl:gap-5",
          "grid sm:grid-cols-1 justify-between divide-y divide-gray-200 text-sm"
        )}
      >
        <li className="flex flex-row justify-between items-center py-2 gap-4">
          <p className="font-semibold text-gray-900">Created At</p>
          <p className="text-gray-700 truncate">
            {getUSDate(request.createdAt)}
          </p>
        </li>
        <li className="flex flex-row justify-between items-center py-2 gap-4">
          <p className="font-semibold text-gray-900">Model</p>
          <ModelPill model={request.model} />
        </li>
        {request.status.statusType === "success" && (
          <li className="flex flex-row justify-between items-center py-2 gap-4">
            <p className="font-semibold text-gray-900">Tokens</p>
            <div className="flex flex-row items-center space-x-1">
              <p className="text-gray-700 truncate">{request.totalTokens}</p>
              <Tooltip
                title={`Completion Tokens: ${request.completionTokens} - Prompt Tokens: ${request.promptTokens}`}
              >
                <InformationCircleIcon className="h-4 w-4 inline text-gray-500" />
              </Tooltip>
            </div>
          </li>
        )}
        <li className="flex flex-row justify-between items-center py-2 gap-4">
          <p className="font-semibold text-gray-900">Latency</p>
          <p className="text-gray-700 truncate">
            <span>{Number(request.latency) / 1000}s</span>
          </p>
        </li>
        <li className="flex flex-row justify-between items-center py-2 gap-4">
          <p className="font-semibold text-gray-900">Status</p>
          <StatusBadge
            statusType={request.status.statusType}
            errorCode={request.status.code}
          />
        </li>
        <li className="flex flex-row justify-between items-center py-2 gap-4">
          <p className="font-semibold text-gray-900">User</p>
          <p className="text-gray-700 truncate">{request.user}</p>
        </li>
        <li className="flex flex-row justify-between items-center py-2 gap-4">
          <p className="font-semibold text-gray-900">Path</p>
          <p className="text-gray-700 truncate">{getPathName(request.path)}</p>
        </li>
        <li className="flex flex-row justify-between items-center py-2 gap-4">
          <p className="font-semibold text-gray-900">ID</p>
          <p className="text-gray-700 truncate">{request.id}</p>
        </li>
      </ul>
      {request.customProperties &&
        properties.length > 0 &&
        Object.keys(request.customProperties).length > 0 && (
          <div className="flex flex-col space-y-2">
            <p className="font-semibold text-gray-900 text-sm">
              Custom Properties
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              {properties.map((property, i) => {
                if (
                  request.customProperties &&
                  request.customProperties.hasOwnProperty(property)
                ) {
                  return (
                    <li
                      className="flex flex-col space-y-1 justify-between text-left p-2.5 shadow-sm border border-gray-300 rounded-lg min-w-[5rem]"
                      key={i}
                    >
                      <p className="font-semibold text-gray-900">{property}</p>
                      <p className="text-gray-700">
                        {request.customProperties[property] as string}
                      </p>
                    </li>
                  );
                }
              })}
            </div>
          </div>
        )}
      <div className="flex w-full justify-end">
        <ThemedTabs
          options={[
            {
              label: "Pretty",
              icon: EyeIcon,
            },
            {
              label: "JSON",
              icon: CodeBracketIcon,
            },
          ]}
          onOptionSelect={(option) =>
            setMode(option.toLowerCase() as "pretty" | "json")
          }
        />
      </div>
      {mode === "pretty" ? (
        <div className="flex flex-col space-y-2">{request.render}</div>
      ) : (
        <Completion
          request={JSON.stringify(request.requestBody, null, 4)}
          response={{
            title: "Response",
            text: JSON.stringify(request.responseBody, null, 4),
          }}
        />
      )}
    </div>
  );
}
