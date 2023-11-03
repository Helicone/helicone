import {
  CodeBracketIcon,
  EyeIcon,
  HandThumbDownIcon,
  HandThumbUpIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { Tooltip } from "@mui/material";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import ThemedTabs from "../../../shared/themed/themedTabs";
import { getUSDateFromString } from "../../../shared/utils/utils";
import { Completion } from "../../requests/completion";
import { NormalizedRequest } from "../builder/abstractRequestBuilder";
import ModelPill from "../modelPill";
import StatusBadge from "../statusBadge";
import { clsx } from "../../../shared/clsx";
import {
  HandThumbUpIcon as HTUp,
  HandThumbDownIcon as HTDown,
} from "@heroicons/react/24/solid";
import { SUPABASE_AUTH_TOKEN } from "../../../../lib/constants";
import Cookies from "js-cookie";
import { updateRequestFeedback } from "../../../../services/lib/requests";
import useNotification from "../../../shared/notification/useNotification";

function getPathName(url: string) {
  try {
    return new URL(url).pathname;
  } catch (e) {
    return url;
  }
}

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

const RequestView = (props: {
  request: NormalizedRequest;
  properties: string[];
  open?: boolean;
  wFull?: boolean;
  displayPreview?: boolean;
}) => {
  const {
    request,
    properties,
    open = true,
    wFull = false,
    displayPreview = true,
  } = props;
  const [requestFeedback, setRequestFeedback] = useState<{
    createdAt: string | null;
    id: string | null;
    rating: boolean | null;
  }>(request.feedback);

  const router = useRouter();
  const { setNotification } = useNotification();

  const updateFeedbackHandler = async (requestId: string, rating: boolean) => {
    updateRequestFeedback(requestId, rating)
      .then((res) => {
        if (res && res.status === 200) {
          setRequestFeedback({
            ...requestFeedback,
            rating: rating,
          });
          setNotification("Feedback submitted", "success");
        }
      })
      .catch((err) => {
        console.error(err);
        setNotification("Error submitting feedback", "error");
      });
  };

  return (
    <div className="flex flex-col h-full space-y-8">
      <div className="flex flex-row items-center">
        <ul
          className={clsx(
            wFull && "2xl:grid-cols-4 2xl:gap-5",
            "grid grid-cols-1 gap-x-4 divide-y divide-gray-300 justify-between text-sm w-full"
          )}
        >
          <li className="flex flex-row justify-between items-center py-2 gap-4">
            <p className="font-semibold text-gray-900">Created At</p>
            <p className="text-gray-700 truncate ">
              {new Date(request.createdAt).toLocaleString("en-US")}
            </p>
          </li>
          <li className="flex flex-row justify-between items-center py-2 gap-4">
            <p className="font-semibold text-gray-900">Model</p>
            <div className="">
              <ModelPill model={request.model} />
            </div>
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
            <p className="font-semibold text-gray-900 ">Status</p>
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
          {displayPreview && (
            <li className="flex flex-row justify-between items-center py-2 gap-4">
              <p className="font-semibold text-gray-900">ID</p>
              <p className="text-gray-700 truncate">{request.id}</p>
            </li>
          )}
        </ul>
      </div>

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
      {displayPreview && (
        <div className="flex flex-col space-y-8">
          <div className="flex w-full justify-end">
            <div className="flex flex-row items-center space-x-4">
              <button
                onClick={() => {
                  if (requestFeedback.rating === true) {
                    return;
                  }

                  updateFeedbackHandler(request.id, true);
                }}
              >
                {requestFeedback.rating === true ? (
                  <HTUp className={clsx("h-5 w-5 text-green-500")} />
                ) : (
                  <HandThumbUpIcon className="h-5 w-5 text-green-500" />
                )}
              </button>
              <button
                onClick={() => {
                  if (requestFeedback.rating === false) {
                    return;
                  }

                  updateFeedbackHandler(request.id, false);
                }}
              >
                {requestFeedback.rating === false ? (
                  <HTDown className={clsx("h-5 w-5 text-red-500")} />
                ) : (
                  <HandThumbDownIcon className="h-5 w-5 text-red-500" />
                )}
              </button>
            </div>
          </div>

          <div className="flex flex-col space-y-2">{request.render}</div>
        </div>
      )}
    </div>
  );
};

export default RequestView;
