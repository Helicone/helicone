import { Col, Row } from "@/components/layout/common";
import Link from "next/link";
import { useEvaluatorDetails } from "./hooks";
import { Evaluator } from "./types";

export const ExperimentsForEvaluator = ({
  evaluator,
}: {
  evaluator: Evaluator;
}) => {
  const { experiments } = useEvaluatorDetails(evaluator, () => {});

  return (
    <>
      {experiments.data?.data?.data && (
        <Col className="space-y-2">
          <h3 className="text-lg font-medium">Experiments</h3>
          <span>
            This evaluator has been used in the following experiments:
          </span>
          <Col className="space-y-2">
            {experiments.data?.data?.data?.map((experiment) => (
              <div key={experiment.experiment_id}>
                <Link
                  href={`/experiments/${experiment.experiment_id}`}
                  className="hover:underline"
                >
                  <Row className="justify-between w-full">
                    <span>{experiment.experiment_name}</span>
                    <span>
                      {new Date(
                        experiment.experiment_created_at
                      ).toLocaleString()}
                    </span>
                  </Row>
                </Link>
              </div>
            ))}
          </Col>
        </Col>
      )}
    </>
  );
};
