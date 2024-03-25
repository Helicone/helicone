import { useState } from "react";
import { formatNumber } from "../users/initialColumns";
import { NormalizedRequest } from "./builder/abstractRequestBuilder";
import ModelPill from "./modelPill";
import StatusBadge from "./statusBadge";
import {
  HandThumbUpIcon as HTUp,
  HandThumbDownIcon as HTDown,
} from "@heroicons/react/24/solid";
import {
  HandThumbDownIcon,
  HandThumbUpIcon,
} from "@heroicons/react/24/outline";
import { clsx } from "../../shared/clsx";
import { updateRequestFeedback } from "../../../services/lib/requests";
import useNotification from "../../shared/notification/useNotification";
import CostPill from "./costPill";

interface RequestCardProps {
  request: NormalizedRequest;
  properties: string[];
}

const RequestCard = (props: RequestCardProps) => {
  const { request, properties } = props;

  const [requestFeedback, setRequestFeedback] = useState<{
    createdAt: string | null;
    id: string | null;
    rating: boolean | null;
  }>(request.feedback);
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(false);

  const { setNotification } = useNotification();

  const updateFeedbackHandler = async (requestId: string, rating: boolean) => {
    setIsFeedbackLoading(true);
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
      })
      .finally(() => {
        setIsFeedbackLoading(false);
      });
  };

  return (
    <div className="rounded-lg px-4 pb-4 pt-8 flex flex-row justify-between w-full relative gap-8">
      <div className="sticky top-8 flex flex-col space-y-4 h-full w-full max-w-md text-gray-900 dark:text-gray-100">
        <div className=" flex flex-row justify-between items-center w-full border-b border-gray-100 dark:border-gray-900 py-2">
          <div className="flex flex-row items-center gap-2">
            <p className="font-semibold text-xl">
              {new Date(request.createdAt).toLocaleString()}
            </p>
            <StatusBadge
              statusType={request.status.statusType}
              errorCode={request.status.code}
            />
          </div>

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

        <div className="flex flex-wrap gap-4 items-center">
          <ModelPill model={request.model} />

          <p className="text-sm font-semibold">
            {Number(request.latency) / 1000}s
          </p>
          {!request.cost && request.status.code === 200 ? (
            <CostPill />
          ) : request.cost ? (
            <p className="text-sm font-semibold">
              ${formatNumber(request.cost)}
            </p>
          ) : (
            <p className="text-sm font-semibold"></p>
          )}
        </div>
        <div className="flex flex-col space-y-4">
          <p className="text-sm">
            <span className="font-semibold">User:</span> {request.user}
          </p>
          <p className="text-sm">
            <span className="font-semibold">Total Tokens:</span>{" "}
            {request.totalTokens}{" "}
            <span className="text-gray-600 text-xs">
              (Completion: {request.completionTokens} / Prompt:{" "}
              {request.promptTokens})
            </span>
          </p>
          {request.customProperties &&
            properties.length > 0 &&
            Object.keys(request.customProperties).length > 0 && (
              <>
                {properties.map((property, i) => {
                  if (
                    request.customProperties &&
                    request.customProperties.hasOwnProperty(property)
                  ) {
                    return (
                      <p className="text-sm" key={i}>
                        <span className="font-semibold">{property}:</span>{" "}
                        {request.customProperties[property] as string}
                      </p>
                    );
                  }
                })}
              </>
            )}
        </div>
      </div>
      <div className="w-full max-w-3xl">{request.render()}</div>
    </div>
  );
};

export default RequestCard;
