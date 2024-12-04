import React, { useState } from "react";
import { Col, Row } from "@/components/layout/common";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { getJawnClient } from "@/lib/clients/jawn";
import { useOrg } from "@/components/layout/organizationContext";
import Link from "next/link";

interface LLMAsJudgeEvaluatorDetailsProps {
  evaluator: any; // Replace 'any' with the correct type
  deleteEvaluator: any; // Replace 'any' with the correct type
  setSelectedEvaluator: (evaluator: any | null) => void;
}

const LLMAsJudgeEvaluatorDetails: React.FC<LLMAsJudgeEvaluatorDetailsProps> = ({
  evaluator,
  deleteEvaluator,
  setSelectedEvaluator,
}) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const org = useOrg();

  const experiments = useQuery({
    queryKey: ["experiments", evaluator.id],
    queryFn: () => {
      const jawn = getJawnClient(org?.currentOrg?.id!);
      return jawn.GET("/v1/evaluator/{evaluatorId}/experiments", {
        params: {
          path: {
            evaluatorId: evaluator.id,
          },
        },
      });
    },
  });

  return (
    <Col className="space-y-4">
      <p>This evaluator is a LLM as a judge evaluator.</p>

      <Col className="space-y-2">
        <h3 className="text-lg font-medium">LLM Template</h3>
        <ScrollArea className="h-[50vh] border rounded-md">
          <code className="p-2 rounded-md whitespace-pre-wrap">
            {JSON.stringify(evaluator.llm_template, null, 2)}
          </code>
        </ScrollArea>
        <span>Editing is not yet supported for LLM as a judge evaluators.</span>
      </Col>
      {experiments.data?.data?.data && (
        <Col className="space-y-2">
          <h3 className="text-lg font-medium">Experiments</h3>
          <span>
            This evaluator has been used in the following experiments:
          </span>
          <Col className="space-y-2">
            {experiments.data?.data?.data?.map((experiment) => (
              <div key={experiment.experiment_id}>
                <Button variant="link" className="p-0" asChild>
                  <Link href={`/experiments/${experiment.experiment_id}`}>
                    <Row className="justify-between">
                      <span>{experiment.experiment_id}</span>
                      <span>
                        {new Date(
                          experiment.experiment_created_at
                        ).toLocaleString()}
                      </span>
                    </Row>
                  </Link>
                </Button>
              </div>
            ))}
          </Col>
        </Col>
      )}
      <Button variant="destructive" onClick={() => setShowDeleteModal(true)}>
        Delete
      </Button>

      <AlertDialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to delete this evaluator?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Please type the name of the
              evaluator to confirm:
              <br />
              <span className="text-red-500">{evaluator.name}</span>
              <Input
                className="mt-2"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder={evaluator.name}
              />
              <i>
                This will remove the evaluator from all{" "}
                {experiments.data?.data?.data?.length ?? 0} experiments. Your
                scores will still be saved, but you will not be able to use this
                evaluator in new experiments.
              </i>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteConfirmation === evaluator.name) {
                  deleteEvaluator.mutate(evaluator.id);
                  setShowDeleteModal(false);
                  setSelectedEvaluator(null);
                }
              }}
              disabled={deleteConfirmation !== evaluator.name}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Col>
  );
};

export default LLMAsJudgeEvaluatorDetails;
