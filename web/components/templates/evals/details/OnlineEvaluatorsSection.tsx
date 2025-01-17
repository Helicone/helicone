import { Col, Row } from "@/components/layout/common";
import { Button } from "@/components/ui/button";
import { SimpleTable } from "@/components/shared/table/simpleTable";
import { PlusIcon, TrashIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import AddOnlineEvaluatorForm from "../AddOnlineEvaluatorForm";
import { useEvaluatorDetails } from "./hooks";

interface OnlineEvaluatorsSectionProps {
  onlineEvaluators: Array<{
    id: string;
    config: any;
  }>;
  createOnlineEvaluator: ReturnType<
    typeof useEvaluatorDetails
  >["createOnlineEvaluator"];
  deleteOnlineEvaluator: ReturnType<
    typeof useEvaluatorDetails
  >["deleteOnlineEvaluator"];
  showCreateModal: boolean;
  setShowCreateModal: (show: boolean) => void;
}

export const OnlineEvaluatorsSection = ({
  onlineEvaluators,
  createOnlineEvaluator,
  deleteOnlineEvaluator,
  showCreateModal,
  setShowCreateModal,
}: OnlineEvaluatorsSectionProps) => {
  return (
    <Col className="space-y-2">
      <Row className="justify-between">
        <h3 className="text-lg font-medium">Online Evaluators</h3>
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogTrigger asChild>
            <Button>
              Create <PlusIcon className="w-4 h-4 ml-2" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Online Evaluator</DialogTitle>
            </DialogHeader>
            <DialogDescription>
              Create a new online evaluator for this evaluator.
            </DialogDescription>
            <AddOnlineEvaluatorForm
              onSubmit={(data) => {
                createOnlineEvaluator.mutate(data);
              }}
              isLoading={createOnlineEvaluator.isLoading}
              close={() => setShowCreateModal(false)}
            />
          </DialogContent>
        </Dialog>
      </Row>
      <span>
        This evaluator has been used in the following online evaluators:
      </span>
      <Col className="space-y-2">
        <SimpleTable<{
          sampleRate: number;
          properties: any;
          actions: any;
        }>
          columns={[
            {
              key: "sampleRate",
              header: "Sample Rate",
              render: (item) => item.sampleRate,
            },
            {
              key: "properties",
              header: "Properties",
              render: (item) =>
                item.properties.map(
                  (property: { key: string; value: string }) => (
                    <span key={property.key}>
                      <span className="font-medium">{property.key}</span>:{" "}
                      {property.value}
                    </span>
                  )
                ),
            },
            {
              key: "actions",
              header: "Actions",
              render: (item) => item.actions,
            },
          ]}
          data={
            onlineEvaluators?.map((item) => ({
              sampleRate: (item.config as { sampleRate: number }).sampleRate,
              properties: (
                item.config as {
                  propertyFilters: { key: string; value: string }[];
                }
              ).propertyFilters,
              actions: (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="w-8 h-8"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will delete the online evaluator and your requests
                        will no longer be evaluated by this evaluator.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        variant="destructive"
                        onClick={() => deleteOnlineEvaluator.mutate(item.id)}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ),
            })) ?? []
          }
        />
      </Col>
    </Col>
  );
};
