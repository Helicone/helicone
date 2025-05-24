import { Row } from "@/components/layout/common";
import { useOrg } from "@/components/layout/org/organizationContext";
import { Button } from "@/components/ui/button";
import { getJawnClient } from "@/lib/clients/jawn";
import { useQuery } from "@tanstack/react-query";
import { NavLink } from "react-router";

interface PromptIdPageProps {
  promptId: string;
}

const ExperimentPanel = (props: PromptIdPageProps) => {
  const { promptId } = props;
  const org = useOrg();
  const experiments = useQuery({
    queryKey: ["experiments", org?.currentOrg?.id, promptId],
    queryFn: async (query) => {
      const orgId = org?.currentOrg?.id;
      const jawn = getJawnClient(orgId);
      const result = await jawn.GET("/v1/prompt/{promptId}/experiments", {
        params: {
          path: {
            promptId: promptId,
          },
        },
      });
      return result;
    },
  });

  return (
    <>
      <div className="flex flex-col w-full space-y-4">
        {experiments.data?.data?.data?.map((experiment) => (
          <Row
            key={experiment.id}
            className="justify-between items-center max-w-md"
          >
            {experiment.created_at}
            <NavLink
              to={`/prompts/${promptId}/subversion/${experiment.meta?.["prompt_version"]}/experiment/${experiment.id}`}
            >
              <Button>View</Button>
            </NavLink>
          </Row>
        ))}
      </div>
    </>
  );
};

export default ExperimentPanel;
