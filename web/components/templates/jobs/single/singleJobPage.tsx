import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { JobStatus } from "../../../../lib/sql/jobs";
import { useLocalStorage } from "../../../../services/hooks/localStorage";
import AuthHeader from "../../../shared/authHeader";
import { clsx } from "../../../shared/clsx";
import { ThemedSwitch } from "../../../shared/themed/themedSwitch";
import StatusBadge from "../statusBadge";
import { useSingleJobPage } from "../useSingleJobPage";
import Flow from "./flow";
import LoadingAnimation from "../../../shared/loadingAnimation";

interface SingleJobPageProps {
  jobId: string | null;
}

const SingleJobPage = (props: SingleJobPageProps) => {
  const { jobId } = props;

  const [isLive, setIsLive] = useLocalStorage("isLive", false);

  const { nodes: nodes, job: job } = useSingleJobPage(jobId ?? "", isLive);

  return (
    <div>
      <AuthHeader
        title={`${jobId}`}
        breadcrumb={{
          href: "/jobs",
          title: "Jobs",
        }}
        headerActions={
          <div className="flex flex-row gap-4">
            <button
              onClick={() => nodes.refetch()}
              className="font-medium text-black text-sm items-center flex flex-row hover:text-sky-700"
            >
              <ArrowPathIcon
                className={clsx(false ? "animate-spin" : "", "h-5 w-5 inline")}
              />
            </button>
            <StatusBadge
              statusType={
                (job.data?.heliconeJob?.[0]?.status ?? "UNKNOWN") as JobStatus
              }
            />
          </div>
        }
        actions={
          <>
            <ThemedSwitch checked={isLive} onChange={setIsLive} label="Live" />
          </>
        }
      />
      {nodes.loading ? (
        <LoadingAnimation title={`Loading Job...`} />
      ) : (
        <Flow
          jobNodes={
            nodes.data?.heliconeNode?.map((node) => {
              return {
                id: node?.id ?? "dsafds",
                data: {
                  node: node!,
                },
                parentIds: node?.parent_node_ids ?? [],
              };
            }) ?? []
          }
        />
      )}
    </div>
  );
};

export default SingleJobPage;
