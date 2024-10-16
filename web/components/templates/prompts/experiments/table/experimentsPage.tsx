import AuthHeader from "../../../../shared/authHeader";
import { useExperiments } from "../../../../../services/hooks/prompts/experiments";
import ThemedTable from "../../../../shared/themed/table/themedTable";
import { useRouter } from "next/router";
import { PlusIcon, DocumentPlusIcon } from "@heroicons/react/24/outline";
import useNotification from "../../../../shared/notification/useNotification";
import { usePrompts } from "../../../../../services/hooks/prompts/prompts";
import { StartFromPromptDialog } from "./components/startFromPromptDialog";
import { Dialog, DialogTrigger } from "../../../../ui/dialog";

interface ExperimentsPageProps {}

import { useState } from "react";
const ExperimentsPage = (props: ExperimentsPageProps) => {
  const notification = useNotification();
  const { prompts } = usePrompts();
  const [dialogOpen, setDialogOpen] = useState(false);
  const router = useRouter();
  const { experiments, isLoading } = useExperiments({
    page: 1,
    pageSize: 25,
  });

  const templateOptions = [
    { id: "text-classification", name: "Text classification" },
    { id: "knowledge-retrieval", name: "Knowledge retrieval" },
    { id: "step-by-step", name: "Step-by-step instructions" },
  ];

  return (
    <>
      <AuthHeader title={"Experiments"} />

      <div className="mb-6 overflow-x-auto px-4">
        <h3 className="text-md font-normal px-4 py-2 text-[#6B7280]">
          Create a new experiment
        </h3>
        <div className="flex space-x-4 p-4">
          <div>
            <button
              className="flex flex-col items-center justify-center w-40 h-32 bg-white rounded-lg hover:bg-transparent transition-colors border-2 border-slate-100"
              onClick={() => router.push("/experiments/new")}
            >
              <PlusIcon className="w-16 h-16 text-slate-200" />
            </button>
            <span className="mt-2 text-sm text-[#6B7280] px-2">
              Start from scratch
            </span>
          </div>
          <div className="flex flex-col items-center justify-center">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <button className="flex flex-col items-center justify-center w-40 h-32 bg-white rounded-lg hover:bg-transparent transition-colors border-2 border-slate-100">
                  <DocumentPlusIcon className="w-16 h-16 text-slate-200" />
                </button>
              </DialogTrigger>
              <StartFromPromptDialog
                prompts={prompts as any}
                onDialogClose={() => setDialogOpen(false)}
              />
            </Dialog>
            <span className="mt-2 text-sm text-[#6B7280] px-2">
              Start from a prompt
            </span>
          </div>
          {templateOptions.map((template) => (
            <div key={template.id}>
              <button
                className="flex flex-col items-center justify-center w-40 h-32 bg-white rounded-lg hover:bg-transparent  transition-colors border-2 border-slate-100"
                onClick={() =>
                  notification.setNotification(
                    "Templates are coming soon!",
                    "info"
                  )
                }
              ></button>
              <span className="mt-2 text-sm text-[#6B7280] px-2">
                {template.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      <ThemedTable
        defaultColumns={[
          {
            header: "Name",
            accessorFn: (row) => {
              return row.experimentName || row.datasetName;
            },
          },
          {
            header: "Created At",
            accessorKey: "created_at",
            minSize: 100,
            accessorFn: (row) => {
              return new Date(row.createdAt ?? 0).toLocaleString();
            },
          },
          {
            header: "Model",
            accessorKey: "model",
          },
        ]}
        defaultData={experiments}
        dataLoading={isLoading}
        id="experiments"
        skeletonLoading={false}
        onRowSelect={(row) => {
          router.push(`/experiments/${row.id}`);
        }}
        fullWidth={true}
      />
    </>
  );
};

export default ExperimentsPage;
