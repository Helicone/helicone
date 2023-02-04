/**
 * Welcome to Cloudflare Workers! This is your first scheduled worker.
 *
 * - Run `wrangler dev --local` in your terminal to start a development server
 * - Run `curl "http://localhost:8787/cdn-cgi/mf/scheduled"` to trigger the scheduled event
 * - Go back to the console to see what your worker has logged
 * - Update the Cron trigger in wrangler.toml (see https://developers.cloudflare.com/workers/wrangler/configuration/#triggers)
 * - Run `wrangler publish --name my-worker` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/runtime-apis/scheduled-event/
 */

export interface Env {
  // Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
  // MY_KV_NAMESPACE: KVNamespace;
  //
  // Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
  // MY_DURABLE_OBJECT: DurableObjectNamespace;
  //
  // Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
  // MY_BUCKET: R2Bucket;
  HEARTBEAT_URL: string;
  OPENAI_API_KEY: string;
}

export default {
  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    console.log("RUNNING SCHEDULED JOB");
    try {
      const completion = await fetch("https://oai.hconeai.com/v1/completions", {
        method: "POST",
        headers: {
          "OpenAI-Organization": "",
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.OPENAI_API_KEY}}`,
        },
        body: JSON.stringify({
          model: "text-ada-001",
          prompt: "What is up my",
          temperature: 0,
          max_tokens: 7,
        }),
      });
      const completionJson = await completion.json<{ model: string }>();
      console.log(completionJson);
      if (completionJson.model !== "text-ada-001") {
        console.log("Model mismatch");
      } else {
        fetch(env.HEARTBEAT_URL);
        console.log("Heartbeat sent");
      }
    } catch (e) {}
  },
};
