import { useState } from "react";
import { getTimeAgo } from "../../../../lib/sql/timeHelpers";
import HcBreadcrumb from "../../../ui/hcBreadcrumb";
import { formatLargeNumber } from "../../../shared/utils/numberFormat";

function timeDiff(startTime: Date, endTime: Date): string {
  const diff = endTime.getTime() - startTime.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const milliseconds = diff % 1000;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (hours == 0 && minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else if (hours == 0 && minutes == 0 && seconds == 0) {
    return `${milliseconds}ms`;
  } else {
    return `${seconds}.${milliseconds}s`;
  }
}

export const BreadCrumb = ({
  sessionId,
  startTime,
  endTime,
  numTraces,
  sessionCost,
  promptTokens,
  completionTokens,
  models,
  users,
}: {
  sessionId: string;
  startTime?: Date;
  endTime?: Date;
  numTraces: number;
  sessionCost: number;
  models: string[];
  promptTokens: number;
  completionTokens: number;
  users: string[];
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="w-full h-full flex flex-col space-y-8">
      <div className="flex flex-row items-center justify-between">
        <div className="flex flex-col items-start space-y-4 w-full">
          <HcBreadcrumb
            pages={[
              {
                href: "/sessions",
                name: "Sessions",
              },
              {
                href: `/sessions/${sessionId}`,
                name: sessionId,
              },
            ]}
          />
          <div className="flex justify-between w-full">
            <div className="flex gap-4 items-end">
              <h1 className="font-semibold text-4xl text-black dark:text-white">
                {sessionId}
              </h1>
            </div>
          </div>
          <ul className="list-disc flex items-center gap-7 text-sm text-gray-500">
            <p>
              Last used{" "}
              <span className="text-sky-500 font-semibold">
                {getTimeAgo(endTime)}
              </span>
            </p>
            <li className={expanded ? "" : "hidden"}>
              Created on:{" "}
              <span className="font-semibold">
                {startTime ? startTime.toLocaleDateString() : ""}
              </span>
            </li>

            <li>
              {" "}
              <span className="font-semibold">{numTraces}</span> trace
              {numTraces == 1 ? "" : "s"}
            </li>
            <li>
              Total Cost:{" "}
              <span className="font-semibold">
                ${formatLargeNumber(sessionCost)}
              </span>
            </li>
            <li>
              Total Latency:{" "}
              <span className="font-semibold">
                {startTime && endTime ? timeDiff(startTime, endTime) : ""}
              </span>
            </li>

            <li
              onClick={() => setExpanded(true)}
              className={expanded ? "hidden" : "hover:cursor-pointer"}
            >
              More...
            </li>

            <ul
              className={
                expanded
                  ? "list-disc flex items-center gap-6 text-sm text-gray-500"
                  : "hidden"
              }
            >
              <li className={users.length > 0 ? "" : "hidden"}>
                User{users.length == 1 ? "" : "s"}:{" "}
                {users.map((user, idx) => (
                  <a
                    href="/users"
                    target="_blank"
                    key={idx}
                    className="font-semibold text-xs border-2 border-solid border-gray-500 rounded-md gap-2 px-2 mx-1"
                  >
                    {user}
                  </a>
                ))}
              </li>

              <li>
                Model{models.length == 1 ? "" : "s"}:{" "}
                {models.map((model, index) => (
                  <span key={index} className="font-semibold">
                    {model +
                      (models.length != 1 && index != models.length - 1
                        ? ", "
                        : "")}
                  </span>
                ))}
              </li>

              <li>
                Total Tokens:{" "}
                <span className="font-semibold">
                  {promptTokens + completionTokens}
                </span>
              </li>
              <li>
                Prompt Tokens:{" "}
                <span className="font-semibold">{promptTokens}</span>
              </li>
              <li>
                Completion Tokens:{" "}
                <span className="font-semibold">{completionTokens}</span>
              </li>

              <li
                onClick={() => setExpanded(false)}
                className={expanded ? "hover:cursor-pointer" : "hidden"}
              >
                Less...
              </li>
            </ul>
          </ul>
        </div>
      </div>
    </div>
  );
};
