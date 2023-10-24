import { Helicone } from "../core/HeliconeOpenAIApi";
import {
  HeliconeAsyncLogger,
  HeliconeAsyncLogRequest,
  Provider,
  ProviderRequest,
} from "./HeliconeAsyncLogger";
import OpenAI from "openai";
import * as Core from "openai/core";
import { ChatCompletionCreateParams } from "openai/resources/chat/completions";
import { CompletionCreateParams } from "openai/resources/completions";
import * as hcone from "./HeliconeOpenAITypes";
import { HeliconeHeaderBuilder } from "../core/HeliconeHeaderBuilder";
import { IHeliconeAsyncClientOptions } from "../core/HeliconeClientOptions";
import { Stream } from "openai/streaming";
import { EmbeddingCreateParams } from "openai/resources";
import { wrapAPIPromise } from "./HeliconeMonkeyPatch";
import { Response } from "@whatwg-node/fetch";

export class HeliconeAsyncOpenAI extends OpenAI {
  public helicone: Helicone;
  private originalCompletionCreate: hcone.CompletionCreateFunction;
  private originalChatCreate: hcone.ChatCreateFunction;
  private originalEmbeddingCreate: hcone.EmbeddingCreateFunction;
  private heliconeHeaders: { [key: string]: string };
  private logger: HeliconeAsyncLogger;

  constructor(private options: IHeliconeAsyncClientOptions) {
    const {
      apiKey = Core.readEnv("OPENAI_API_KEY"),
      organization = Core.readEnv("OPENAI_ORG_ID") ?? null,
      heliconeMeta: providedHeliconeMeta = {},
      ...opts
    } = options;
    super({ apiKey, organization, ...opts });

    const heliconeMeta = {
      ...providedHeliconeMeta,
      apiKey: providedHeliconeMeta.apiKey || Core.readEnv("HELICONE_API_KEY"),
      baseUrl: providedHeliconeMeta.baseUrl ?? "https://api.hconeai.com",
    };

    this.helicone = new Helicone(heliconeMeta);
    this.logger = new HeliconeAsyncLogger(options);
    this.heliconeHeaders = new HeliconeHeaderBuilder(heliconeMeta)
      .withPropertiesHeader()
      .withUserHeader()
      .build();

    this.monkeyPatch();
  }

  private monkeyPatch(): void {
    this.originalCompletionCreate = this.completions.create;
    this.completions.create = this.customCompletionCreate.bind(this);

    this.originalChatCreate = this.chat.completions.create;
    this.chat.completions.create = this.customChatCreate.bind(this);

    this.originalEmbeddingCreate = this.embeddings.create;
    this.embeddings.create = this.customEmbeddingCreate.bind(this);
  }

  private customCompletionCreate<T extends CompletionCreateParams>(
    body: T,
    options?: Core.RequestOptions
  ): hcone.CompletionCreateReturnType<T> {
    const startTime = Date.now();
    const isStream = options?.stream ?? body?.stream ?? false;
    const [loggingStreamPromise, resolveLoggingStream] =
      this.createDeferredPromise<Stream<any> | null>();

    const result = wrapAPIPromise(
      this.originalCompletionCreate(body, options),
      (loggingStream) => {
        resolveLoggingStream(loggingStream);
      }
    );

    result.finally(async () => {
      try {
        await this.logRequest(
          startTime,
          result,
          body,
          isStream,
          loggingStreamPromise
        );
      } catch (error: any) {
        console.error("Error logging request: ", error);
      }
    });

    return result as hcone.CompletionCreateReturnType<T>;
  }

  private customChatCreate<T extends ChatCompletionCreateParams>(
    body: T,
    options?: Core.RequestOptions
  ): hcone.ChatCreateReturnType<T> {
    const startTime = Date.now();
    const isStream = options?.stream ?? body?.stream ?? false;
    const [loggingStreamPromise, resolveLoggingStream] =
      this.createDeferredPromise<Stream<any> | null>();

    const result = wrapAPIPromise(
      this.originalChatCreate(body, options),
      (loggingStream) => {
        resolveLoggingStream(loggingStream);
      }
    );

    result.finally(async () => {
      try {
        await this.logRequest(
          startTime,
          result,
          body,
          isStream,
          loggingStreamPromise
        );
      } catch (error: any) {
        console.error("Error logging request: ", error);
      }
    });

    return result as hcone.ChatCreateReturnType<T>;
  }

  private customEmbeddingCreate<T extends EmbeddingCreateParams>(
    body: T,
    options?: Core.RequestOptions
  ): hcone.EmbeddingCreateReturnType<T> {
    const startTime = Date.now();
    const result = this.originalEmbeddingCreate(body, options);
    result.finally(async () => {
      try {
        await this.logRequest(startTime, result, body, false, null);
      } catch (error: any) {
        console.error("Error logging request: ", error);
      }
    });

    return result as hcone.EmbeddingCreateReturnType<T>;
  }

  private createDeferredPromise<T>(): [
    Promise<T>,
    (value: T) => void,
    (reason?: any) => void
  ] {
    let resolver: (value: T) => void = () => {};
    let rejecter: (reason?: any) => void = () => {};
    const promise = new Promise<T>((resolve, reject) => {
      resolver = resolve;
      rejecter = reject;
    });

    return [promise, resolver, rejecter];
  }

  private async logRequest(
    startTime: number,
    result: Core.APIPromise<any>,
    body: {
      [key: string]: any;
    },
    isStream: boolean,
    streamPromise: Promise<Stream<any> | null> | null
  ) {
    const endTime = Date.now();
    const providerRequest: ProviderRequest = {
      url: this.baseURL,
      json: body,
      meta: this.heliconeHeaders,
    };

    let response: Response | undefined = undefined;
    let json: { [key: string]: any } = {};
    if (isStream) {
      const streamResult = await this.handleStreamedResponse(
        result,
        streamPromise!
      );

      response = streamResult.response;
      json = streamResult.json;
    } else {
      const resultData = await result.withResponse();
      response = resultData.response;
      json =
        response.status !== 200 ? { error: resultData.data } : resultData.data;
    }

    const asyncLogRequest: HeliconeAsyncLogRequest = {
      providerRequest: providerRequest,
      providerResponse: {
        json: json,
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
      },
      timing: HeliconeAsyncLogger.createTiming(startTime, endTime),
    };

    await this.logger.log(asyncLogRequest, Provider.OPENAI);
  }

  private async handleStreamedResponse(
    result: Core.APIPromise<any>,
    streamPromise: Promise<Stream<any> | null>
  ): Promise<{ response: Response; json: { [key: string]: any } }> {
    const loggingStream = await streamPromise;
    const response = await result.asResponse();
    let streamedData: Record<string, any>[] = [];

    if (loggingStream) {
      for await (const chunk of loggingStream) {
        streamedData.push(chunk);
      }
    }

    return {
      response,
      json: { streamed_data: streamedData },
    };
  }
}
