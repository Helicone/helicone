import { GenericResult } from "../../results";

export interface Prompt {
  prompt: string;
  values: { [key: string]: string };
}

interface Message {
  role: string;
  content: string;
}

export interface ChatPrompt {
  prompt: Message[];
  values: { [key: string]: string };
}

export interface FormattedPrompt {
  body: string;
  prompt: Prompt | ChatPrompt;
}

function formatPrompt(prompt: Prompt): GenericResult<string> {
  let formattedString = prompt.prompt;
  const missingValues = [];

  for (const key in prompt.values) {
    const placeholder = new RegExp(`{{${key}}}`, "g");
    if (!formattedString.includes(`{{${key}}}`)) {
      missingValues.push(key);
    } else {
      formattedString = formattedString.replace(
        placeholder,
        prompt.values[key]
      );
    }
  }

  const regex = /{{([^{}]+)}}/g;
  let match = regex.exec(formattedString);
  const missingPlaceholders = [];

  while (match) {
    // eslint-disable-next-line no-prototype-builtins
    if (!prompt.values.hasOwnProperty(match[1])) {
      missingPlaceholders.push(match[1]);
    }
    match = regex.exec(formattedString);
  }

  return {
    data: formattedString,
    error: null,
  };
}

export function extractPrompt(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  json: Record<string, any>
): GenericResult<FormattedPrompt> {
  try {
    if ("messages" in json) {
      return extractPromptMessages(json);
    }

    const prompt = JSON.parse(json["prompt"]);
    const stringPromptResult = formatPrompt(prompt);
    if (stringPromptResult.error !== null) {
      return {
        data: null,
        error: stringPromptResult.error,
      };
    }
    const stringPrompt = stringPromptResult.data;
    json["prompt"] = stringPrompt;
    const body = JSON.stringify(json);

    return {
      data: {
        body: body,
        prompt: prompt,
      },
      error: null,
    };
  } catch (error) {
    console.error(error);
    return {
      data: null,
      error: `Error parsing prompt: ${error}`,
    };
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractPromptMessages(json: any): GenericResult<FormattedPrompt> {
  const regexPrompt = json["messages"];
  const regexMessages = regexPrompt;
  const regexValues = json["values"];

  // If regexValues is not defined, return an error
  if (regexValues === undefined) {
    return {
      data: null,
      error: "Missing values in the template-formatted prompt",
    };
  }

  const formattedMessages = [];
  for (let i = 0; i < regexMessages.length; i++) {
    const message = regexMessages[i];
    const content = message["content"];

    const formattedContent = formatPrompt({
      prompt: content,
      values: regexValues,
    });

    if (formattedContent.error !== null) {
      return {
        data: null,
        error: formattedContent.error,
      };
    }

    const formattedMessage = {
      ...message,
      content: formattedContent.data,
    };

    formattedMessages.push(formattedMessage);
  }
  json["messages"] = formattedMessages;
  delete json["values"];

  const body = JSON.stringify(json);

  return {
    data: {
      prompt: {
        prompt: regexPrompt,
        values: regexValues,
      },
      body,
    },
    error: null,
  };
}
