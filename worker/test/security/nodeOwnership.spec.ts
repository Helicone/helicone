import { describe, expect, it, vi } from "vitest";
import { validateNodeReferences } from "../../src/lib/security/nodeOwnership";

const ORG = "org-a";
const JOB = "job-a";

function reader(
  job: { org_id: string } | null,
  parent: { org_id: string; job: string } | null = null
): Parameters<typeof validateNodeReferences>[0] {
  return {
    getJobById: vi.fn(async () => ({
      data: job,
      error: job ? null : "missing",
    })),
    getNodeById: vi.fn(async () => ({
      data: parent,
      error: parent ? null : "missing",
    })),
  } as unknown as Parameters<typeof validateNodeReferences>[0];
}

describe("node reference ownership", () => {
  it("accepts a job and parent node in the caller's organization and job", async () => {
    expect(
      await validateNodeReferences(
        reader({ org_id: ORG }, { org_id: ORG, job: JOB }),
        ORG,
        JOB,
        "parent-a"
      )
    ).toBeNull();
  });

  it("rejects a job in another organization before checking its parent", async () => {
    const db = reader({ org_id: "org-b" });
    expect(await validateNodeReferences(db, ORG, JOB, "parent-a")).toBe("job");
    expect(db.getNodeById).not.toHaveBeenCalled();
  });

  it("rejects a parent from another organization", async () => {
    expect(
      await validateNodeReferences(
        reader({ org_id: ORG }, { org_id: "org-b", job: JOB }),
        ORG,
        JOB,
        "parent-b"
      )
    ).toBe("parent");
  });

  it("rejects a parent from a different job in the same organization", async () => {
    expect(
      await validateNodeReferences(
        reader({ org_id: ORG }, { org_id: ORG, job: "job-other" }),
        ORG,
        JOB,
        "parent-other"
      )
    ).toBe("parent");
  });
});
