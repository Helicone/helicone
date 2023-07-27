import {
  BeakerIcon,
  ClipboardDocumentIcon,
  CodeBracketIcon,
  EyeIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { Tooltip } from "@mui/material";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import useNotification from "../../shared/notification/useNotification";
import ThemedDrawer from "../../shared/themed/themedDrawer";
import ThemedTabs from "../../shared/themed/themedTabs";
import { getUSDate } from "../../shared/utils/utils";
import { Completion } from "../requests/completion";
import { NormalizedRequest } from "./builder/abstractRequestBuilder";
import ModelPill from "./modelPill";
import StatusBadge from "./statusBadge";

interface RequestDrawerV2Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  request?: NormalizedRequest;
  properties: string[];
}
function getPathName(url: string) {
  try {
    return new URL(url).pathname;
  } catch (e) {
    return url;
  }
}

const RequestDrawerV2 = (props: RequestDrawerV2Props) => {
  const { open, setOpen, request, properties } = props;

  const [mode, setMode] = useState<"pretty" | "json">("pretty");
  const { setNotification } = useNotification();
  const router = useRouter();

  const setOpenHandler = (drawerOpen: boolean) => {
    // if the drawerOpen boolean is true, open the drawer
    if (drawerOpen) {
      setOpen(true);
    }
    // if the drawerOpen boolean is false, close the drawer and clear the requestId
    else {
      setOpen(false);
      const { pathname, query } = router;
      delete router.query.requestId;
      router.replace({ pathname, query }, undefined, { shallow: true });
    }
  };

  // set the mode to pretty if the drawer closes, also clear the requestId
  useEffect(() => {
    if (!open) {
      setMode("pretty");
    }
  }, [open, router]);

  return (
    <ThemedDrawer
      open={open}
      setOpen={setOpenHandler}
      actions={
        <div className="w-full flex flex-row justify-between pl-1">
          <Tooltip title="Playground">
            <button
              onClick={() => {
                if (request) {
                  router.push("/playground?request=" + request.id);
                }
              }}
              className="hover:bg-gray-200 rounded-md -m-1 p-1"
            >
              <BeakerIcon className="h-5 w-5" />
            </button>
          </Tooltip>
          <Tooltip title="Copy">
            <button
              onClick={() => {
                setNotification("Copied to clipboard", "success");
                const copy = { ...request };
                delete copy.render;
                navigator.clipboard.writeText(
                  JSON.stringify(copy || {}, null, 4)
                );
              }}
              className="hover:bg-gray-200 rounded-md -m-1 p-1"
            >
              <ClipboardDocumentIcon className="h-5 w-5" />
            </button>
          </Tooltip>
        </div>
      }
    >
      {request ? (
        <div className="flex flex-col h-full space-y-8">
          <ul className="divide-y divide-gray-200 text-sm">
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
                  <p className="text-gray-700 truncate">
                    {request.totalTokens}
                  </p>
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
              <p className="text-gray-700 truncate">
                {getPathName(request.path)}
              </p>
            </li>
            <li className="flex flex-row justify-between items-center py-2 gap-4">
              <p className="font-semibold text-gray-900">ID</p>
              <p className="text-gray-700 truncate">{request.id}</p>
            </li>
          </ul>
          {request.customProperties &&
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
                          <p className="font-semibold text-gray-900">
                            {property}
                          </p>
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
      ) : (
        <p>Loading...</p>
      )}
    </ThemedDrawer>
  );
};

export default RequestDrawerV2;
