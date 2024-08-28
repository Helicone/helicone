import React, { useState } from "react";
import { Row } from "../../layout/common";
import HcButton from "../../ui/hcButton";
import MarkdownEditor from "../../shared/markdownEditor";
import useNotification from "../../shared/notification/useNotification";
import { DatasetRow } from "./datasetsIdPage";

interface EditDatasetProps {
  selectedRow: DatasetRow;
}

function isJSON(str: string) {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
}

const EditDataset: React.FC<EditDatasetProps> = ({ selectedRow }) => {
  const { setNotification } = useNotification();
  const [requestBody, setRequestBody] = useState(
    JSON.stringify(selectedRow?.request_body, null, 2)
  );
  const [responseBody, setResponseBody] = useState(
    JSON.stringify(selectedRow?.response_body, null, 2)
  );

  const handleSave = () => {
    if (!isJSON(requestBody) || !isJSON(responseBody)) {
      setNotification("Invalid JSON", "error");
      return;
    }
    console.log(requestBody, responseBody);
  };

  return (
    <div className="flex flex-col space-y-4">
      <Row className="justify-between">
        <h2 className="text-2xl font-semibold">{selectedRow?.id}</h2>
        <Row className="gap-2">
          <HcButton
            variant="secondary"
            size="sm"
            title="Reset"
            onClick={() => {
              setRequestBody(
                JSON.stringify(selectedRow?.request_body, null, 2)
              );
              setResponseBody(
                JSON.stringify(selectedRow?.response_body, null, 2)
              );
            }}
          />
          <HcButton
            variant="secondary"
            size="sm"
            title="Save"
            onClick={handleSave}
          />
        </Row>
      </Row>
      <div className="flex flex-col space-y-4">
        <Row className="gap-5">
          <div className="w-1/2">
            <h3 className="text-lg font-semibold">Request Body</h3>
            <MarkdownEditor
              text={requestBody}
              language="json"
              setText={(text) => {
                setRequestBody(text);
              }}
            />
          </div>
          <div className="w-1/2">
            <MarkdownEditor
              text={responseBody}
              language="json"
              setText={(text) => {
                setResponseBody(text);
              }}
            />
          </div>
        </Row>
      </div>
    </div>
  );
};

export default EditDataset;
