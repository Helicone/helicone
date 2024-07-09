import { getTimeAgo } from "../../../../lib/sql/timeHelpers";
import HcBreadcrumb from "../../../ui/hcBreadcrumb";

export const BreadCrumb = ({
  sessionId,
  startTime,
  endTime,
}: {
  sessionId: string;
  startTime: Date;
  endTime: Date;
}) => {
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
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <p className="">last used {getTimeAgo(endTime)}</p>

            <div className="rounded-full h-1 w-1 bg-slate-400" />
            <p className="">created on {startTime.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
