import {
  BookOpenIcon,
  ChevronLeftIcon,
  CircleStackIcon,
  DocumentTextIcon,
  PaintBrushIcon,
  SparklesIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  Select,
  SelectItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from "@tremor/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePrompts } from "../../../../../services/hooks/prompts/prompts";
import { usePrompt } from "../../../../../services/hooks/prompts/singlePrompt";
import ThemedDrawer from "../../../../shared/themed/themedDrawer";
import { getUSDateFromString } from "../../../../shared/utils/utils";
import ThemedModal from "../../../../shared/themed/themedModal";
import ThemedTableV5 from "../../../../shared/themed/table/themedTableV5";

interface PromptDatasetIdPageProps {
  id: string;
}

const PromptDatasetIdPage = (props: PromptDatasetIdPageProps) => {
  const { id } = props;
  const { prompts, isLoading } = usePrompts();

  const currentPrompt = prompts?.data?.prompts.find((p) => p.id === id);
  const [selectedVersion, setSelectedVersion] = useState<string>();

  const selectedPrompt = usePrompt({
    version: selectedVersion || "0",
    promptId: id,
  });

  const [inputOpen, setInputOpen] = useState(false);

  // the selected request to view in the tempalte
  const [selectedInput, setSelectedInput] = useState<{
    id: string;
    createdAt: string;
    properties: Record<string, string>;
    response: string;
  }>();

  // set the selected version to the latest version on initial load
  useEffect(() => {
    if (currentPrompt) {
      setSelectedVersion(currentPrompt.latest_version.toString());
    }
  }, [currentPrompt]);

  return (
    <>
      <div>
        <ThemedTableV5
          defaultData={[
            {
              idz: "1",
            },
          ]}
          defaultColumns={[
            {
              accessorFn: (row) => row.idz,
              id: "id",
              header: "ID",
              cell: (info) => info.getValue(),
            },
          ]}
          dataLoading={false}
          tableKey="prompt-dataset"
          onRowSelect={(row) => {
            console.log(row);
          }}
        />
      </div>
    </>
  );
};

export default PromptDatasetIdPage;
