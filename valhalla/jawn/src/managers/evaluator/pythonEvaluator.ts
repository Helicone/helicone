import { err, ok, Result } from "../../lib/shared/result";
import { SandboxPool } from "./SanboxPool";

const pool = new SandboxPool({ concurrency: 50, opts: {} });

function withTimeout<T>(promise: Promise<T>, timeout: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), timeout)
    ),
  ]);
}

export async function pythonEvaluator({
  code,
  requestBodyString,
  responseString,
  orgId,
  uniqueId,
}: {
  code: string;
  requestBodyString: string;
  responseString: string;
  orgId: string;
  uniqueId: string;
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
  const sandbox = await pool.getSandbox({ id: orgId });

  console.log("Got sandbox:", sandbox.id);

  process.on("SIGINT", () => {
    sandbox.shutdown();
  });

  process.on("SIGTERM", () => {
    sandbox.shutdown();
  });

  const traces: string[] = [];
  try {
    console.log("Writing files");
    await withTimeout(
      Promise.all([
        sandbox.fs.writeFile(
          `/tmp/${uniqueId}/request.json`,
          new TextEncoder().encode(requestBodyString),
          {
            create: true,
            overwrite: true,
          }
        ),

        await sandbox.fs.writeFile(
          `/tmp/${uniqueId}/response.json`,
          new TextEncoder().encode(responseString),
          {
            create: true,
            overwrite: true,
          }
        ),
      ]),
      10000
    );

    const result = await withTimeout(
      sandbox.shells.python.run(`HELICONE_EXECUTION_ID="${uniqueId}"\n${code}`),
      10000
    );
    traces.push(result.output);

    let output = "";
    try {
      output = await withTimeout(
        sandbox.fs.readFile(`/tmp/${uniqueId}/output.txt`),
        10000
      ).then((r) => r.toString());
    } catch (e) {
      console.error(e);
    }

    await withTimeout(sandbox.shells.run(`rm -rf /tmp/${uniqueId}`), 10000);

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
  }
}
