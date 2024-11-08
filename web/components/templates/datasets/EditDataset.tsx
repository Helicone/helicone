import React from "react";
import { Row } from "../../layout/common";
import MarkdownEditor from "../../shared/markdownEditor";
import { DatasetRow } from "./datasetsIdPage";
import { ArrowUpRightIcon } from "@heroicons/react/24/outline";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

interface EditDatasetProps {
  selectedRow: DatasetRow;
  isEditing: boolean;
  requestBody: string;
  responseBody: string;
  onRequestBodyChange: (text: string) => void;
  onResponseBodyChange: (text: string) => void;
}

const EditDataset: React.FC<EditDatasetProps> = ({
  selectedRow,
  isEditing,
  requestBody,
  responseBody,
  onRequestBodyChange,
  onResponseBodyChange,
}) => {
  return (
    <div className="flex flex-col space-y-4">
      <Row className="justify-start items-center space-x-2">
        <h2 className="text-2xl font-semibold">{selectedRow?.id}</h2>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <ArrowUpRightIcon
                className="h-5 w-5 text-gray-500 cursor-pointer"
                onClick={() => {
                  window.open(
                    `/requests?requestId=${selectedRow?.origin_request_id}`,
                    "_blank"
                  );
                }}
              />
            </TooltipTrigger>
            <TooltipContent>View original request</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </Row>
      <div className="flex flex-col space-y-4">
        <Row className="gap-5">
          <Card className="w-1/2">
            <CardHeader className="bg-muted">
              <h3 className="text-md font-medium">Request Body</h3>
            </CardHeader>
            <CardContent className="p-0">
              <MarkdownEditor
                text={requestBody}
                language="json"
                className="border-none"
                setText={(text) => {
                  if (isEditing) onRequestBodyChange(text);
                }}
              />
            </CardContent>
          </Card>
          <Card className="w-1/2">
            <CardHeader className="bg-muted">
              <h3 className="text-md font-medium">Response Body</h3>
            </CardHeader>
            <CardContent className="p-0">
              <MarkdownEditor
                text={responseBody}
                language="json"
                className="border-none"
                setText={(text) => {
                  if (isEditing) onResponseBodyChange(text);
                }}
              />
            </CardContent>
          </Card>
        </Row>
      </div>
    </div>
  );
};

export default EditDataset;
