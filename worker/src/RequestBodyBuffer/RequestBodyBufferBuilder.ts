import { DataDogClient } from "../lib/monitoring/DataDogClient";
import { IRequestBodyBuffer } from "./IRequestBodyBuffer";
import { RequestBodyBuffer_InMemory } from "./RequestBodyBuffer_InMemory";

export async function RequestBodyBufferBuilder(
  request: Request,
  dataDogClient: DataDogClient | undefined,
  requestBodyBufferEnv: Env["REQUEST_BODY_BUFFER"],
  requestId: string
): Promise<IRequestBodyBuffer> {
  //TODO uncomment this and make it work...
  // const MAX_SIZE = 1024 * 1024 * 50; // 50mb
  // const [reader1, reader2] = request.body?.tee() ?? [];

  // let size = 0;
  // const reader = reader1?.getReader();
  // if(!reader) {
  //   return new RequestBodyBuffer_InMemory(request, dataDogClient);
  // }
  // let {done, value} = await reader?.read();
  // while (!done) {
  //   size += value.length;

  //   ({done, value} = await reader?.read());
  //   if(value.length > MAX_SIZE) {
  //     return new RequestBodyBuffer_Remote(request, dataDogClient, requestBodyBufferEnv, requestId);
  //   }
  // }

  return new RequestBodyBuffer_InMemory(request, dataDogClient);
}
