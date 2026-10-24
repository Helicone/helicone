import { afterEach, describe, expect, it, vi } from "vitest";
import { createAPIClient } from "../../src/api/lib/apiClient";
import { InternalResponse } from "../../src/api/lib/internalResponse";
import { getAPIRouter } from "../../src/routers/api/apiRouter";
import type { BaseOpenAPIRouter } from "../../src/routers/routerFactory";

vi.mock("../../src/api/lib/apiClient", () => ({ createAPIClient: vi.fn() }));

type Handler = (
  route: unknown,
  wrapper: unknown,
  env: unknown,
  ctx: unknown
) => Promise<Response>;

function nodeHandler(): Handler {
  let handler: Handler | undefined;
  const router = Object.fromEntries(
    ["all", "delete", "get", "options", "patch", "post", "put"].map(
      (method) => [
        method,
        (path: string, callback: Handler) => {
          if (method === "post" && path === "/node") handler = callback;
        },
      ]
    )
  );
  getAPIRouter(router as unknown as BaseOpenAPIRouter);
  if (!handler) throw new Error("/node route was not registered");
  return handler;
}

function setup(jobOrg: string, parent?: { org_id: string; job: string }) {
  const addNode = vi.fn(async () => ({ data: null, error: null }));
  const getNodeById = vi.fn(async () => ({
    data: parent ?? null,
    error: parent ? null : "missing",
  }));
  vi.mocked(createAPIClient).mockResolvedValue({
    db: {
      getAuthParams: vi.fn(async () => ({
        data: { organizationId: "org-a" },
        error: null,
      })),
      getJobById: vi.fn(async () => ({
        data: { org_id: jobOrg },
        error: null,
      })),
      getNodeById,
    },
    queue: { addNode },
    response: InternalResponse,
  } as never);
  return { addNode, getNodeById };
}

async function invoke(handler: Handler) {
  return handler(
    {},
    {
      unsafeGetJson: vi.fn(async () => ({
        name: "child",
        job: "job-a",
        parentJobId: "parent-a",
      })),
    },
    {},
    {}
  );
}

afterEach(() => {
  vi.resetAllMocks();
  vi.restoreAllMocks();
});

describe("POST /node tenant boundary", () => {
  it("rejects a foreign job before inserting a node", async () => {
    const { addNode, getNodeById } = setup("org-b");
    const response = await invoke(nodeHandler());

    expect(response.status).toBe(404);
    expect(getNodeById).not.toHaveBeenCalled();
    expect(addNode).not.toHaveBeenCalled();
  });

  it("rejects a parent from another organization or job", async () => {
    const { addNode } = setup("org-a", {
      org_id: "org-b",
      job: "job-a",
    });
    const response = await invoke(nodeHandler());

    expect(response.status).toBe(404);
    expect(addNode).not.toHaveBeenCalled();
  });

  it("inserts a node whose job and parent belong to the caller", async () => {
    const { addNode } = setup("org-a", {
      org_id: "org-a",
      job: "job-a",
    });
    const response = await invoke(nodeHandler());

    expect(response.status).toBe(200);
    expect(addNode).toHaveBeenCalledOnce();
    expect(addNode).toHaveBeenCalledWith(
      expect.objectContaining({ org_id: "org-a", job: "job-a" }),
      { parent_job_id: "parent-a" }
    );
  });
});
