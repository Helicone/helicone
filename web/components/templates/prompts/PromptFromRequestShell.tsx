import { useParams } from "react-router";
import PromptEditor from "./id/PromptEditor";

const PromptFromRequestShell = () => {
  const { requestId } = useParams();
  return <PromptEditor requestId={requestId} />;
};

export default PromptFromRequestShell;
