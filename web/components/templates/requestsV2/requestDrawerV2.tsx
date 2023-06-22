import { InformationCircleIcon } from "@heroicons/react/24/outline";
import { Tooltip } from "@mui/material";
import ThemedDrawer from "../../shared/themed/themedDrawer";
import { getUSDate } from "../../shared/utils/utils";
import { NormalizedRequest } from "./builder/abstractRequestBuilder";
import ModelPill from "./modelPill";
import StatusBadge from "./statusBadge";

interface RequestDrawerV2Props {
  open: boolean;
  setOpen: (open: boolean) => void;
  request?: NormalizedRequest;
  properties: string[];
}

const RequestDrawerV2 = (props: RequestDrawerV2Props) => {
  const { open, setOpen, request, properties } = props;

  return (
    <ThemedDrawer open={open} setOpen={setOpen}>
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
            {request.status === 200 && (
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
              <StatusBadge status={request.status} />
            </li>
            <li className="flex flex-row justify-between items-center py-2 gap-4">
              <p className="font-semibold text-gray-900">User</p>
              <p className="text-gray-700 truncate">{request.user}</p>
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
          <div className="flex flex-col space-y-2">{request.render}</div>
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </ThemedDrawer>
  );
};

export default RequestDrawerV2;
