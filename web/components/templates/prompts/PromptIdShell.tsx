import { useParams } from "react-router";
import PromptEditor from "./id/PromptEditor";

const PromptIdShell = () => {
  const { promptId } = useParams();
  return <PromptEditor promptId={promptId} />;
};

export default PromptIdShell;
