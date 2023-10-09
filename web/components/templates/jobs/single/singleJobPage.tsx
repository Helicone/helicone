import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { JobStatus } from "../../../../lib/sql/jobs";
import { useLocalStorage } from "../../../../services/hooks/localStorage";
import AuthHeader from "../../../shared/authHeader";
import { clsx } from "../../../shared/clsx";
import { ThemedSwitch } from "../../../shared/themed/themedSwitch";
import StatusBadge from "../statusBadge";
import { useSingleJobPage } from "../useSingleJobPage";
import Flow from "./flow";

interface SingleJobPageProps {
  jobId: string | null;
}

const SingleJobPage = (props: SingleJobPageProps) => {
  const { jobId } = props;

  const [isLive, setIsLive] = useLocalStorage("isLive", false);

  // const router = useRouter();
  const { nodes: nodes, job: job } = useSingleJobPage(jobId ?? "", isLive);
  // const { requests, properties } = useRequestsPageV2(
  //   1,
  //   25,
  //   [],
  //   "all",
  //   {
  //     created_at: "desc",
  //   },
  //   false,
  //   false
  // );

  return (
    <div>
      <AuthHeader
        title={`Job View`}
        headerActions={
          <div className="flex flex-row gap-2">
            <button
              onClick={() => nodes.refetch()}
              className="font-medium text-black text-sm items-center flex flex-row hover:text-sky-700"
            >
              <ArrowPathIcon
                className={clsx(false ? "animate-spin" : "", "h-5 w-5 inline")}
              />
            </button>
            <i
              className="text-gray-400 text-sm"
              style={{ alignSelf: "center" }}
            >
              {jobId}
            </i>
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
    </div>
  );
};

export default SingleJobPage;
