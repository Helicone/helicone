import React, { useState } from "react";
import { Row } from "../../layout/common";
import HcButton from "../../ui/hcButton";
import MarkdownEditor from "../../shared/markdownEditor";
import useNotification from "../../shared/notification/useNotification";
import { DatasetRow } from "./datasetsIdPage";

interface EditDatasetProps {
  selectedRow: DatasetRow;
  isEditing: boolean;
  onSave: () => void;
  onCancel: () => void;
}

function isJSON(str: string) {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
}

const EditDataset: React.FC<EditDatasetProps> = ({
  selectedRow,
  isEditing,
  onSave,
  onCancel,
}) => {
  const { setNotification } = useNotification();
  const [requestBody, setRequestBody] = useState(
    JSON.stringify(selectedRow?.request_response_body?.request, null, 2)
  );
  const [responseBody, setResponseBody] = useState(
    JSON.stringify(selectedRow?.request_response_body?.response, null, 2)
  );

  const handleSave = () => {
    if (!isJSON(requestBody) || !isJSON(responseBody)) {
      setNotification("Invalid JSON", "error");
      return;
    }
    console.log(requestBody, responseBody);
    onSave();
  };

  return (
    <div className="flex flex-col space-y-4">
      <Row className="justify-between">
        <h2 className="text-2xl font-semibold">{selectedRow?.id}</h2>
        {isEditing && (
          <Row className="gap-2">
            <HcButton
              variant="secondary"
              size="sm"
              title="Cancel"
              onClick={onCancel}
            />
            <HcButton
              variant="secondary"
              size="sm"
              title="Save"
              onClick={handleSave}
            />
          </Row>
        )}
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
                  if (isEditing) setRequestBody(text);
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
                  if (isEditing) setResponseBody(text);
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
