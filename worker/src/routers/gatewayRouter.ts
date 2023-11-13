import { Env } from "..";
import { proxyForwarder } from "../lib/HeliconeProxyRequest/forwarder";
import { RequestWrapper } from "../lib/RequestWrapper";
import { BaseRouter } from "./routerFactory";

export const getGatewayAPIRouter = (router: BaseRouter) => {
  // proxy forwarder only
  router.all(
    "*",
    async (
      _,
      requestWrapper: RequestWrapper,
      env: Env,
      ctx: ExecutionContext
    ) => {
      const provider =
        requestWrapper.heliconeHeaders.targetProvider ?? "CUSTOM";
      return await proxyForwarder(requestWrapper, env, ctx, provider);
    }
  );

  return router;
};

/*
curl -X POST "https://gateway.hconeai.com" -H "Helicone-Target-URL: $ENDPOINT_URL" -H "Helicone-Target-Provider: together.ai" \
     -H "Authorization: Bearer $API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"model": "togethercomputer/RedPajama-INCITE-7B-Instruct", "prompt": "Q: The capital of France is?\nA:", "temperature": 0.8, "top_p": 0.7, "top_k": 50, "max_tokens": 1, "repetition_penalty": 1}'

API_KEY="2ec1e9b5efd6a7131098d575d979669c7c70acd8e6da09ceaaaaf2b5ffad291a"
ENDPOINT_URL="https://api.together.xyz/inference"
curl -X POST "$ENDPOINT_URL" \
     -H "Authorization: Bearer $API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"model": "togethercomputer/RedPajama-INCITE-7B-Instruct", "prompt": "Q: The capital of France is?\nA:", "temperature": 0.8, "top_p": 0.7, "top_k": 50, "max_tokens": 1, "repetition_penalty": 1}'
{"status":"finished","prompt":["Q: The capital of France is?\nA:"],"model":"togethercomputer/RedPajama-INCITE-7B-Instruct","model_owner":"","tags":{},"num_returns":1,"args":{"model":"togethercomputer/RedPajama-INCITE-7B-Instruct","prompt":"Q: The capital of France is?\nA:","temperature":0.8,"top_p":0.7,"top_k":50,"max_tokens":1,"repetition_penalty":1},"subjobs":[],"output":{"choices":[{"text":" Paris"}],"request_id":"823966ffea7815d2-SJC"}
*/
