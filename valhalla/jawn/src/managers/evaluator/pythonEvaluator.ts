import { CodeSandbox } from "@codesandbox/sdk";
import { err, ok, Result } from "../../lib/shared/result";
import { SandboxPool } from "./SanboxPool";

const pool = new SandboxPool({ concurrency: 50, opts: {} });

export async function testPythonEvaluator({
  code,
  requestBodyString,
  responseString,
}: {
  code: string;
  requestBodyString: string;
  responseString: string;
}): Promise<
  Result<
    {
      output: string;
      traces: string[];
      statusCode?: number;
    },
    string
  >
> {
  console.log("Starting");
  const sdk = new CodeSandbox();

  console.log("Creating sandbox");

  const sandbox = await sdk.sandbox.create();
  process.on("SIGINT", () => {
    sandbox.shutdown();
  });

  process.on("SIGTERM", () => {
    sandbox.shutdown();
  });

  // process.on("SIGQUIT", () => {
  //   sandbox.shutdown();
  // });

  // process.on("SIGKILL", () => {
  //   sandbox.shutdown();
  // });

  const traces: string[] = [];
  try {
    await Promise.all([
      sandbox.fs.writeFile(
        "/tmp/request.json",
        new TextEncoder().encode(requestBodyString)
      ),

      await sandbox.fs.writeFile(
        "/tmp/response.json",
        new TextEncoder().encode(responseString)
      ),
    ]);

    const result = await sandbox.shells.python.run(code);
    traces.push(result.output);

    let output = "";
    try {
      output = await sandbox.fs
        .readFile("/tmp/output.txt")
        .then((r) => r.toString());
    } catch (e) {
      console.error(e);
    }

    return ok({
      output: output.toString(),
      traces,
      statusCode: result.exitCode,
    });
  } catch (e) {
    console.error(e);
    return err(JSON.stringify(e));
  } finally {
    console.log("Shutting down sandbox");

    sandbox.shutdown();
  }
}
