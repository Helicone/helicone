import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PiPlusBold } from "react-icons/pi";
import { ChartLineIcon } from "lucide-react";
import { EvaluatorCard } from "../cards";
import { Col } from "@/components/layout/common";
import AuthHeader from "@/components/shared/authHeader";
import { useEvaluators } from "../EvaluatorHook";
import { useEvalPanelStore } from "../store/evalPanelStore";
import { useOrg } from "@/components/layout/org/organizationContext";
import { useMemo } from "react";
import { getEvaluatorScoreName } from "../EvaluatorDetailsSheet";
import { FeatureUpgradeCard } from "@/components/shared/helicone/FeatureUpgradeCard";
import clsx from "clsx";
import { useTestDataStore } from "../testing/testingStore";

export const MainPanel = () => {
  const { evaluators } = useEvaluators();
  const { openCreatePanel, openEditPanel, openTestPanel, panels } =
    useEvalPanelStore();
  const org = useOrg();
  const { setTestConfig } = useTestDataStore();

  // Get a simplified list of evaluators from the API response
  const simpleEvaluators = useMemo(() => {
    return (
      evaluators.data?.data?.data?.map((evaluator) => {
        // Determine the evaluator type based on available properties
        let type = "Default";
        if (evaluator.llm_template) {
          type = "LLM as a judge";
        } else if (evaluator.code_template) {
          type = "Python";
        } else if (evaluator.last_mile_config) {
          type = "LastMile";
        }

        return {
          id: evaluator.id,
          name: evaluator.name,
          scoreName: getEvaluatorScoreName(
            evaluator.name,
            evaluator.scoring_type
          ),
          type,
          scoring_type: evaluator.scoring_type,
          evaluator_llm_template: evaluator.llm_template,
          evaluator_code_template: evaluator.code_template,
          evaluator_last_mile_config: evaluator.last_mile_config,
        };
      }) || []
    );
  }, [evaluators.data?.data?.data]);

  if (!org?.currentOrg?.tier) {
    return null;
  }

  if (org?.currentOrg?.tier === "free") {
    return (
      <div className="flex flex-col space-y-2 w-full h-screen items-center justify-center">
        <FeatureUpgradeCard
          title="Unlock Evaluators"
          featureName="Evaluators"
          headerTagline="Evaluate your prompts and models to drive improvements."
          icon={<ChartLineIcon className="h-4 w-4" />}
          highlightedFeature="Evaluators"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-screen">
      <AuthHeader
        title="Evaluators"
        actions={[
          <Button
            key="create-evaluator"
            onClick={() => openCreatePanel()}
            variant="outline"
            size="sm"
            className="gap-1 items-center"
          >
            <PiPlusBold className="h-3.5 w-3.5" />
            Create Evaluator
          </Button>,
        ]}
      />

      {evaluators.isLoading ? (
        // Loading state
        <div className="flex flex-col w-full gap-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card
                key={i}
                className="animate-pulse rounded-xl border shadow-sm"
              >
                <div className="pb-2 p-6">
                  <div className="h-6 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2 mt-2"></div>
                </div>
                <div className="px-6 py-4">
                  <div className="h-10 bg-muted rounded w-full"></div>
                </div>
                <div className="px-6 py-4">
                  <div className="h-8 bg-muted rounded w-full"></div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : simpleEvaluators.length === 0 ? (
        // Empty state
        <div className="flex flex-col w-full justify-center items-center h-full">
          <Col className="items-center justify-center gap-4 max-w-md text-center py-12">
            <div className="bg-muted rounded-full p-3">
              <PiPlusBold className="h-6 w-6 text-foreground" />
            </div>
            <h3 className="text-lg font-medium">No evaluators yet</h3>
            <p className="text-muted-foreground text-sm">
              Create an evaluator to score your LLM outputs
            </p>
            <Button
              onClick={openCreatePanel}
              className="mt-2"
              variant="default"
              size="sm"
            >
              Create Evaluator
            </Button>
          </Col>
        </div>
      ) : (
        // Card grid view
        <div className="flex flex-col w-full gap-6 p-6">
          <div
            className={clsx(
              "grid gap-6",
              panels.length > 1
                ? "grid-cols-1"
                : "grid-cols-1 lg:grid-cols-2 xl:grid-cols-3"
            )}
          >
            {simpleEvaluators.map((evaluator) => (
              <EvaluatorCard
                key={evaluator.id}
                evaluator={evaluator}
                onEdit={openEditPanel}
                onTest={() => {
                  if (evaluator.evaluator_llm_template) {
                    console.log("Setting test data for LLM evaluator");
                    setTestConfig({
                      _type: "llm",
                      evaluator_llm_template: JSON.stringify(
                        evaluator.evaluator_llm_template
                      ),
                      evaluator_scoring_type: evaluator.scoring_type,
                      evaluator_name: evaluator.name || "evaluator",
                    });
                  } else if (evaluator.evaluator_code_template) {
                    console.log("Setting test data for Python evaluator");
                    setTestConfig({
                      _type: "python",
                      evaluator_name: evaluator.name || "Python Evaluator",
                      code: evaluator.evaluator_code_template as string,
                    });
                  } else if (evaluator.evaluator_last_mile_config) {
                    console.log("Setting test data for LastMile evaluator");
                    setTestConfig({
                      _type: "lastmile",
                      evaluator_name: evaluator.name || "LastMile Evaluator",
                      config: evaluator.evaluator_last_mile_config as any,
                    });
                  }
                  openTestPanel();
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
