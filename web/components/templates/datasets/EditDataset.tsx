import React from "react";
import { Row } from "../../layout/common";
import MarkdownEditor from "../../shared/markdownEditor";
import { DatasetRow } from "./datasetsIdPage";
import { ArrowUpRightIcon } from "@heroicons/react/24/outline";
import { styled } from "@mui/material/styles";
import Tooltip, { TooltipProps, tooltipClasses } from "@mui/material/Tooltip";

interface EditDatasetProps {
  selectedRow: DatasetRow;
  isEditing: boolean;
  requestBody: string;
  responseBody: string;
  onRequestBodyChange: (text: string) => void;
  onResponseBodyChange: (text: string) => void;
}

const BlackTooltip = styled(({ className, ...props }: TooltipProps) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.arrow}`]: {
    color: theme.palette.common.black,
  },
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: theme.palette.common.black,
    fontSize: "0.8rem",
  },
}));

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
        <BlackTooltip
          title="View original request"
          className="cursor-pointer"
          placement="top"
        >
          <ArrowUpRightIcon
            className="h-5 w-5 text-gray-500 cursor-pointer"
            onClick={() => {
              window.open(
                `/requests?requestId=${selectedRow?.origin_request_id}`,
                "_blank"
              );
            }}
          />
        </BlackTooltip>
      </Row>
      <div className="flex flex-col space-y-4">
        <Row className="gap-5 ">
          <div
            className={`w-1/2 rounded-xl border border-gray-300 ${
              isEditing ? "bg-white" : "bg-[#F7F7F7]"
            }`}
          >
            <h3 className="text-md rounded-t-xl font-medium border-b bg-[#F7F7F7] border-gray-300 p-4">
              Request Body
            </h3>
            <div className={`overflow-hidden rounded-b-xl `}>
              <MarkdownEditor
                text={requestBody}
                language="json"
                className="border-none"
                setText={(text) => {
                  if (isEditing) onRequestBodyChange(text);
                }}
              />
            </div>
          </div>
          <div
            className={`w-1/2 rounded-xl border border-gray-300 ${
              isEditing ? "bg-white" : "bg-[#F7F7F7]"
            }`}
          >
            <h3 className="text-md rounded-t-xl font-medium border-b bg-[#F7F7F7] border-gray-300 p-4">
              Response Body
            </h3>
            <div className={`rounded-b-xl overflow-hidden`}>
              <MarkdownEditor
                text={responseBody}
                language="json"
                className="border-none"
                setText={(text) => {
                  if (isEditing) onResponseBodyChange(text);
                }}
              />
            </div>
          </div>
        </Row>
      </div>
    </div>
  );
};

export default EditDataset;
