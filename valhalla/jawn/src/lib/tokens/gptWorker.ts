import { parentPort } from "worker_threads";
import { encode as gptEncode } from "gpt-tokenizer";

parentPort?.on("message", (event) => {
  const { inputText } = event;
  try {
    const encoded = gptEncode(inputText);
    parentPort?.postMessage({ success: true, length: encoded.length });
  } catch (error) {
    parentPort?.postMessage({ success: false, error: error });
  }
});
