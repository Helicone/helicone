import React from "react";
import { Row } from "../../layout/common";
import MarkdownEditor from "../../shared/markdownEditor";
import { DatasetRow } from "./datasetsIdPage";

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
      <Row className="justify-between">
        <h2 className="text-2xl font-semibold">{selectedRow?.id}</h2>
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
