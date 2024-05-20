import {
  ArrowPathIcon,
  HandThumbDownIcon,
  HandThumbUpIcon,
  InformationCircleIcon,
  MinusIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { Tooltip } from "@mui/material";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { NormalizedRequest } from "./builder/abstractRequestBuilder";
import ModelPill from "./modelPill";
import StatusBadge from "./statusBadge";
import { clsx } from "../../shared/clsx";
import {
  HandThumbUpIcon as HTUp,
  HandThumbDownIcon as HTDown,
} from "@heroicons/react/24/solid";
import {
  addRequestLabel,
  addRequestScore,
  updateRequestFeedback,
} from "../../../services/lib/requests";
import useNotification from "../../shared/notification/useNotification";
import { useOrg } from "../../layout/organizationContext";
import HcButton from "../../ui/hcButton";
import { TextInput } from "@tremor/react";

function getPathName(url: string) {
  try {
    return new URL(url).pathname;
  } catch (e) {
    return url;
  }
}

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

const RequestRow = (props: {
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

  const org = useOrg();

  const [isAddingLabel, setIsAddingLabel] = useState(false);
  const [isScoresAddingLabel, setIsScoresAddingLabel] = useState(false);
  const [isScoresAdding, setIsScoresAdding] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [currentProperties, setCurrentProperties] = useState<
    {
      [key: string]: string;
    }[]
  >();

  const [currentScores, setCurrentScores] = useState<Record<string, number>>();

  const router = useRouter();
  const { setNotification } = useNotification();

  useEffect(() => {
    // find all the key values of properties and set them to currentProperties
    const currentProperties: {
      [key: string]: string;
    }[] = [];

    properties.forEach((property) => {
      if (
        request.customProperties &&
        request.customProperties.hasOwnProperty(property)
      ) {
        currentProperties.push({
          [property]: request.customProperties[property] as string,
        });
      }
    });

    setCurrentProperties(currentProperties);
    const currentScores: Record<string, number> = request.scores || {};
    setCurrentScores(currentScores);
  }, [properties, request.customProperties, request.scores]);

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

  const onAddLabelHandler = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsAdding(true);

    const formData = new FormData(e.currentTarget);
    const key = formData.get("key") as string;
    const value = formData.get("value") as string;

    if (!key || !value || org?.currentOrg?.id === undefined) {
      setNotification("Error adding label", "error");
      setIsAdding(false);
      return;
    }
    try {
      const res = await addRequestLabel(
        request.id,
        org?.currentOrg?.id,
        key,
        value
      );

      if (res?.status === 200) {
        setNotification("Label added", "success");
        setCurrentProperties(
          currentProperties
            ? [
                ...currentProperties,
                {
                  [key]: value,
                },
              ]
            : [{ [key]: value }]
        );

        setIsAdding(false);
      } else {
        setNotification("Error adding label", "error");
        setIsAdding(false);
      }
    } catch (err) {
      console.error(err);
      setNotification(`Error adding label: ${err}`, "error");
      setIsAdding(false);
      return;
    }
  };

  const onAddScoreHandler = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsScoresAdding(true);

    const formData = new FormData(e.currentTarget);
    const key = formData.get("key") as string;
    const value = formData.get("value") as any as number;

    if (currentScores && currentScores[key]) {
      setNotification("Score already exists", "error");
      setIsScoresAdding(false);
      return;
    }

    if (!key || !value || org?.currentOrg?.id === undefined) {
      setNotification("Error adding score", "error");
      setIsScoresAdding(false);
      return;
    }
    try {
      const res = await addRequestScore(
        request.id,
        org?.currentOrg?.id,
        key,
        value
      );

      if (res?.status === 201) {
        setNotification("Score added", "success");
        setCurrentScores(
          currentScores
            ? {
                ...currentScores,
                [key]: value,
              }
            : { [key]: value }
        );

        setIsScoresAdding(false);
      } else {
        setNotification("Error adding score", "error");
        setIsScoresAdding(false);
      }
    } catch (err) {
      console.error(err);
      setNotification(`Error adding score: ${err}`, "error");
      setIsScoresAdding(false);
      return;
    }
  };

  return (
    <div className="flex flex-col h-full space-y-8">
      <div className="flex flex-row items-center">
        <ul
          className={clsx(
            wFull && "2xl:grid-cols-4 2xl:gap-5",
            "grid grid-cols-1 gap-x-4 divide-y divide-gray-300 dark:divide-gray-700 justify-between text-sm w-full"
          )}
        >
          <li className="flex flex-row justify-between items-center py-2 gap-4">
            <p className="font-semibold text-gray-900 dark:text-gray-100">
              Created At
            </p>
            <p className="text-gray-700 dark:text-gray-300 truncate">
              {new Date(request.createdAt).toLocaleString("en-US")}
            </p>
          </li>
          <li className="flex flex-row justify-between items-center py-2 gap-4">
            <p className="font-semibold text-gray-900 dark:text-gray-100">
              Model
            </p>
            <div className="">
              <ModelPill model={request.model} />
            </div>
          </li>
          {request.status.statusType === "success" && (
            <li className="flex flex-row justify-between items-center py-2 gap-4">
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                Tokens
              </p>
              <div className="flex flex-row items-center space-x-1">
                <p className="text-gray-700 truncate dark:text-gray-300">
                  {request.totalTokens && request.totalTokens >= 0
                    ? request.totalTokens
                    : "not found"}
                </p>
                {request.totalTokens && request.totalTokens >= 0 && (
                  <Tooltip
                    title={`Completion Tokens: ${request.completionTokens} - Prompt Tokens: ${request.promptTokens}`}
                  >
                    <InformationCircleIcon className="h-4 w-4 inline text-gray-500" />
                  </Tooltip>
                )}
              </div>
            </li>
          )}
          <li className="flex flex-row justify-between items-center py-2 gap-4">
            <p className="font-semibold text-gray-900 dark:text-gray-100">
              Latency
            </p>
            <p className="text-gray-700 dark:text-gray-300 truncate">
              <span>{Number(request.latency) / 1000}s</span>
            </p>
          </li>
          <li className="flex flex-row justify-between items-center py-2 gap-4">
            <p className="font-semibold text-gray-900 dark:text-gray-100">
              Status
            </p>
            <StatusBadge
              statusType={request.status.statusType}
              errorCode={request.status.code}
            />
          </li>
          <li className="flex flex-row justify-between items-center py-2 gap-4">
            <p className="font-semibold text-gray-900 dark:text-gray-100">
              User
            </p>
            <p className="text-gray-700 dark:text-gray-300 truncate">
              {request.user}
            </p>
          </li>
          <li className="flex flex-row justify-between items-center py-2 gap-4">
            <p className="font-semibold text-gray-900 dark:text-gray-100">
              Path
            </p>
            <p className="text-gray-700 dark:text-gray-300 truncate">
              {getPathName(request.path)}
            </p>
          </li>
          {displayPreview && (
            <li className="flex flex-row justify-between items-center py-2 gap-4">
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                ID
              </p>
              <p className="text-gray-700 dark:text-gray-300 truncate">
                {request.id}
              </p>
            </li>
          )}
          {request.temperature !== undefined &&
            request.temperature !== null && (
              <li className="flex flex-row justify-between items-center py-2">
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  Temperature
                </p>
                <p className="text-gray-700 dark:text-gray-300 truncate">
                  {Number(request.temperature || 0).toFixed(2)}
                </p>
              </li>
            )}

          {request.timeToFirstToken !== undefined &&
            request.timeToFirstToken !== null && (
              <li className="flex flex-row justify-between items-center py-2">
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  Time to First Token
                </p>
                <p className="text-gray-700 dark:text-gray-300 truncate">
                  {request.timeToFirstToken}ms
                </p>
              </li>
            )}
        </ul>
      </div>

      <div className="flex flex-col">
        <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm items-center flex">
          Custom Properties{" "}
          <Tooltip title="Add a new label" placement="top">
            <button
              onClick={() => {
                setIsAddingLabel(!isAddingLabel);
              }}
              className="ml-1.5 p-0.5 shadow-sm bg-white dark:bg-black border border-gray-300 dark:border-gray-700 rounded-md h-fit"
            >
              {isAddingLabel ? (
                <MinusIcon className="h-3 w-3 text-gray-500" />
              ) : (
                <PlusIcon className="h-3 w-3 text-gray-500" />
              )}
            </button>
          </Tooltip>
        </div>
        {isAddingLabel && (
          <form
            onSubmit={onAddLabelHandler}
            className="flex flex-row items-end space-x-2 py-4 mb-4 border-b border-gray-300 dark:border-gray-700"
          >
            <div className="flex flex-col space-y-1">
              <label
                htmlFor="key"
                className="block text-sm font-semibold leading-6 text-gray-900 dark:text-gray-100"
              >
                Key
              </label>
              <div className="">
                <TextInput
                  type="text"
                  name="key"
                  id="key"
                  required
                  className={clsx(
                    "bg-white dark:bg-black block w-full rounded-md px-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm placeholder:text-gray-400 border border-gray-300 dark:border-gray-700 sm:leading-6"
                  )}
                  placeholder={"Key"}
                />
              </div>
            </div>
            <div className="flex flex-col space-y-1">
              <label
                htmlFor="value"
                className="block text-sm font-semibold leading-6 text-gray-900 dark:text-gray-100"
              >
                Value
              </label>
              <div className="">
                <TextInput
                  type="text"
                  name="value"
                  id="value"
                  required
                  className={clsx(
                    "bg-white dark:bg-black block w-full rounded-md px-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm placeholder:text-gray-400 border border-gray-300 dark:border-gray-700 sm:leading-6"
                  )}
                  placeholder={"Value"}
                />
              </div>
            </div>
            <HcButton
              size="sm"
              title="Add"
              variant="primary"
              className="h-fit flex flex-row rounded-md bg-black dark:bg-white px-4 text-xs font-semibold border border-black dark:border-white hover:bg-gray-900 dark:hover:bg-gray-100 text-gray-50 dark:text-gray-900 shadow-sm hover:text-gray-300 dark:hover:text-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500"
            >
              {isAdding && (
                <ArrowPathIcon className="w-4 h-4 mr-1.5 animate-spin" />
              )}
              Add
            </HcButton>
          </form>
        )}
        <div className="flex flex-wrap gap-4 text-sm items-center pt-2">
          {currentProperties?.map((property, i) => {
            return (
              <li
                className="flex flex-col space-y-1 justify-between text-left p-2.5 shadow-sm border border-gray-300 dark:border-gray-700 rounded-lg min-w-[5rem]"
                key={i}
              >
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {Object.keys(property)[0]}
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  {property[Object.keys(property)[0]]}
                </p>
              </li>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col">
        <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm items-center flex">
          Scores{" "}
          <Tooltip title="Add a new score" placement="top">
            <button
              onClick={() => {
                setIsScoresAddingLabel(!isScoresAddingLabel);
              }}
              className="ml-1.5 p-0.5 shadow-sm bg-white dark:bg-black border border-gray-300 dark:border-gray-700 rounded-md h-fit"
            >
              {isScoresAddingLabel ? (
                <MinusIcon className="h-3 w-3 text-gray-500" />
              ) : (
                <PlusIcon className="h-3 w-3 text-gray-500" />
              )}
            </button>
          </Tooltip>
        </div>
        {isScoresAddingLabel && (
          <form
            onSubmit={onAddScoreHandler}
            className="flex flex-row items-end space-x-2 py-4 mb-4 border-b border-gray-300 dark:border-gray-700"
          >
            <div className="flex flex-col space-y-1">
              <label
                htmlFor="key"
                className="block text-sm font-semibold leading-6 text-gray-900 dark:text-gray-100"
              >
                Key
              </label>
              <div className="">
                <TextInput
                  type="text"
                  name="key"
                  id="key"
                  required
                  className={clsx(
                    "bg-white dark:bg-black block w-full rounded-md px-2  text-sm text-gray-900 dark:text-gray-100 shadow-sm placeholder:text-gray-400 border border-gray-300 dark:border-gray-700 sm:leading-6"
                  )}
                  placeholder={"Key"}
                />
              </div>
            </div>
            <div className="flex flex-col space-y-1">
              <label
                htmlFor="value"
                className="block text-sm font-semibold leading-6 text-gray-900 dark:text-gray-100"
              >
                Value
              </label>
              <div className="">
                <TextInput
                  //@ts-ignore
                  type="number"
                  name="value"
                  id="value"
                  required
                  className={clsx(
                    "bg-white dark:bg-black block w-full rounded-md px-2  text-sm text-gray-900 dark:text-gray-100 shadow-sm placeholder:text-gray-400 border border-gray-300 dark:border-gray-700 sm:leading-6"
                  )}
                  placeholder={"Value"}
                />
              </div>
            </div>
            <HcButton
              size="sm"
              title="Add"
              variant="primary"
              type="submit"
              className="h-fit flex flex-row rounded-md bg-black dark:bg-white px-4 text-xs font-semibold border border-black dark:border-white hover:bg-gray-900 dark:hover:bg-gray-100 text-gray-50 dark:text-gray-900 shadow-sm hover:text-gray-300 dark:hover:text-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500"
            >
              {isAdding && (
                <ArrowPathIcon className="w-4 h-4 mr-1.5 animate-spin" />
              )}
              Add
            </HcButton>
          </form>
        )}

        <div className="flex flex-wrap gap-4 text-sm items-center pt-2">
          {currentScores &&
            Object.entries(currentScores).map(([key, value]) => (
              <li
                className="flex flex-col space-y-1 justify-between text-left p-2.5 shadow-sm border border-gray-300 dark:border-gray-700 rounded-lg min-w-[5rem]"
                key={key}
              >
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {key}
                </p>
                <p className="text-gray-700 dark:text-gray-300">{value}</p>
              </li>
            ))}
        </div>
      </div>

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

          <div className="flex flex-col space-y-2">{request.render()}</div>
        </div>
      )}
    </div>
  );
};

export default RequestRow;
