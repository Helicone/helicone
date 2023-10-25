import {
  ChatCompletion,
  ChatCompletionChunk,
  ChatCompletionCreateParamsBase,
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionCreateParamsStreaming,
} from "openai/resources/chat/completions";
import {
  Completion,
  CompletionCreateParamsBase,
  CompletionCreateParamsNonStreaming,
  CompletionCreateParamsStreaming,
} from "openai/resources/completions";
import { APIPromise, RequestOptions } from "openai/core";
import { Stream } from "openai/streaming";
import {
  CreateEmbeddingResponse,
  EmbeddingCreateParams,
} from "openai/resources/embeddings";

type CompletionCreateFunction = {
  (
    body: CompletionCreateParamsNonStreaming,
    options?: RequestOptions
  ): APIPromise<Completion>;
  (body: CompletionCreateParamsStreaming, options?: RequestOptions): APIPromise<
    Stream<Completion>
  >;
  (body: CompletionCreateParamsBase, options?: RequestOptions): APIPromise<
    Stream<Completion> | Completion
  >;
};

type CompletionCreateReturnType<T> = T extends CompletionCreateParamsStreaming
  ? APIPromise<Stream<Completion>>
  : APIPromise<Completion>;

type ChatCreateFunction = {
  (
    body: ChatCompletionCreateParamsNonStreaming,
    options?: RequestOptions
  ): APIPromise<ChatCompletion>;
  (
    body: ChatCompletionCreateParamsStreaming,
    options?: RequestOptions
  ): APIPromise<Stream<ChatCompletionChunk>>;
  (body: ChatCompletionCreateParamsBase, options?: RequestOptions): APIPromise<
    Stream<ChatCompletionChunk> | ChatCompletion
  >;
};

type ChatCreateReturnType<T> = T extends ChatCompletionCreateParamsStreaming
  ? APIPromise<Stream<ChatCompletionChunk>>
  : APIPromise<ChatCompletion>;

type EmbeddingCreateFunction = {
  (
    body: EmbeddingCreateParams,
    options?: RequestOptions
  ): APIPromise<CreateEmbeddingResponse>;
};

type EmbeddingCreateReturnType<T> = APIPromise<CreateEmbeddingResponse>;

export {
  CompletionCreateFunction,
  CompletionCreateReturnType,
  ChatCreateFunction,
  ChatCreateReturnType,
  EmbeddingCreateFunction,
  EmbeddingCreateReturnType,
};
