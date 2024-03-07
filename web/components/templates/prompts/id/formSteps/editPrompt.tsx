import ChatPlayground from "../../../playground/chatPlayground";
import { Message } from "../../../requests/chat";

interface EditPromptProps {
  heliconeTemplate: any;
  onSubmit: (newPrompt: Message[]) => void;
}

const EditPrompt = (props: EditPromptProps) => {
  const { heliconeTemplate, onSubmit } = props;

  return (
    <>
      <ChatPlayground
        requestId={""}
        chat={heliconeTemplate.messages}
        models={["gpt-3.5-turbo"]}
        temperature={1}
        maxTokens={256}
        onSubmit={(history) => onSubmit(history)}
      />
    </>
  );
};

export default EditPrompt;
