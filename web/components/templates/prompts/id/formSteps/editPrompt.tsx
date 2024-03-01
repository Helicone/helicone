import ChatPlayground from "../../../playground/chatPlayground";
import { Message } from "../../../requests/chat";

interface EditPromptProps {
  heliconeTemplate: any;
  chat: Message[];
}

const EditPrompt = (props: EditPromptProps) => {
  const { heliconeTemplate, chat } = props;

  return (
    <>
      <ChatPlayground
        requestId={""}
        chat={heliconeTemplate.messages}
        models={["gpt-3.5-turbo"]}
        temperature={1}
        maxTokens={256}
      />
    </>
  );
};

export default EditPrompt;
