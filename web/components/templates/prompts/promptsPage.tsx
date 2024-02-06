import { useState } from "react";
import { usePlaygroundPage } from "../../../services/hooks/playground";
import { clsx } from "../../shared/clsx";
import ChatPlayground from "./chatPlayground";
import { useDebounce } from "../../../services/hooks/debounce";
import AuthHeader from "../../shared/authHeader";
import RequestDrawerV2 from "../requestsV2/requestDrawerV2";
import useNotification from "../../shared/notification/useNotification";
import {
  CodeBracketSquareIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { MultiSelect, MultiSelectItem } from "@tremor/react";
import ThemedModal from "../../shared/themed/themedModal";
import Image from "next/image";

interface PromptsPageProps {
  request?: string;
}

const PromptsPage = (props: PromptsPageProps) => {
  const { request } = props;
  const [requestId, setRequestId] = useState<string | undefined>(request);

  const [open, setOpen] = useState<boolean>(false);
  const [infoOpen, setInfoOpen] = useState<boolean>(false);

  const debouncedRequestId = useDebounce(requestId, 500);

  const { data, isLoading, chat, hasData, isChat } = usePlaygroundPage(
    debouncedRequestId || ""
  );

  const singleRequest = data.length > 0 ? data[0] : null;

  const reqBody =
    singleRequest !== null ? (singleRequest.requestBody as any) : null;

  const [selectedModels, setSelectedModels] = useState<string[]>(
    singleRequest !== null ? [singleRequest.model] : []
  );
  const [temperature, setTemperature] = useState<number>(
    reqBody !== null ? reqBody.temperature : 0.7
  );
  const [maxTokens, setMaxTokens] = useState<number>(
    reqBody !== null ? reqBody.max_tokens : 256
  );

  const { setNotification } = useNotification();

  return (
    <>
      <AuthHeader
        title={"Playground"}
        actions={
          <div id="toolbar" className="flex flex-row items-center gap-2 w-full">
            <input
              type="text"
              name="request-id"
              id="request-id"
              onChange={(e) => setRequestId(e.target.value)}
              className={clsx(
                "block w-[22rem] rounded-lg px-4 py-2 text-sm text-gray-900 bg-white shadow-sm border border-gray-300 dark:bg-black dark:text-gray-100 dark:border-gray-700"
              )}
              placeholder="Enter in a Request ID"
              value={requestId}
            />
            <button
              disabled={singleRequest === null}
              onClick={() => {
                if (singleRequest === null) {
                  setNotification("Invalid Request", "error");
                  return;
                }
                setOpen(true);
              }}
              className={clsx(
                singleRequest === null ? "opacity-50" : "",
                "bg-white dark:bg-black border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 hover:bg-sky-50 dark:hover:bg-sky-900 flex flex-row items-center gap-2"
              )}
            >
              <CodeBracketSquareIcon className="h-5 w-5 text-gray-900 dark:text-gray-100" />
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 hidden sm:block">
                View Source
              </p>
            </button>
          </div>
        }
      />
      <div className="grid grid-cols-8 gap-8 h-full w-full pt-4">HEllo</div>
    </>
  );
};

export default PromptsPage;
