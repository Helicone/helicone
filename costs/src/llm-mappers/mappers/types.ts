import { LLMPreview, LlmSchema } from "../types";

export type MapperFn<T, K> = ({
  request,
  response,
  statusCode,
  model,
}: {
  request: T;
  response: K;
  statusCode: number;
  model: string;
}) => {
  schema: LlmSchema;
  preview: LLMPreview;
};
