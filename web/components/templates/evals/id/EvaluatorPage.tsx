import { useState } from "react";
import { useOrg } from "../../../layout/organizationContext";
import AuthHeader from "../../../shared/authHeader";
import LoadingAnimation from "../../../shared/loadingAnimation";
import useSearchParams from "../../../shared/utils/useSearchParams";
import { TimeFilter } from "../../dashboard/dashboardPage";

// Import shadcn components

// Import Recharts components
import { ColumnDef } from "@tanstack/react-table";
import { Col } from "@/components/layout/common";
import HcBreadcrumb from "@/components/ui/hcBreadcrumb";
import { IslandContainer } from "@/components/ui/islandContainer";
import RequestsPageV2 from "../../requestsV2/requestsPageV2";

type EvaluatorMetric = {
  // Define your EvaluatorMetric type here
};

const INITIAL_COLUMNS: ColumnDef<EvaluatorMetric>[] = [
  // Define your initial columns here
];

const EvaluatorPage = () => {
  const org = useOrg();
  const searchParams = useSearchParams();

  const [timeFilter, setTimeFilter] =
    useState<TimeFilter>(/* Initial time filter */);
  const [advancedFilters, setAdvancedFilters] =
    useState(/* Initial advanced filters */);

  return (
    <>
      <IslandContainer>
        <HcBreadcrumb
          pages={[
            {
              href: "/evaluators",
              name: "Evaluators",
            },
          ]}
        />
      </IslandContainer>
      <Col>
        <div>Graph</div>
        <div className="space-y-4">
          <div>Table</div>
          <div>Table</div>
          <RequestsPageV2
            currentPage={1}
            pageSize={10}
            sort={{
              sortKey: null,
              sortDirection: null,
              isCustomProperty: false,
            }}
            isCached={false}
            initialRequestId={undefined}
            userId={undefined}
            rateLimited={false}
            currentFilter={null}
            organizationLayout={null}
            organizationLayoutAvailable={false}
          />
        </div>
      </Col>
    </>
  );
};

export default EvaluatorPage;
