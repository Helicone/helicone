import type { DBWrapper } from "../db/DBWrapper";

type NodeReferenceReader = Pick<DBWrapper, "getJobById" | "getNodeById">;

/** Check every caller-supplied reference before writing with the service role. */
export async function validateNodeReferences(
  db: NodeReferenceReader,
  organizationId: string,
  jobId: string,
  parentNodeId?: string
): Promise<"job" | "parent" | null> {
  const { data: job, error: jobError } = await db.getJobById(jobId);
  if (jobError || !job || job.org_id !== organizationId) {
    return "job";
  }

  if (parentNodeId) {
    const { data: parent, error: parentError } =
      await db.getNodeById(parentNodeId);
    if (
      parentError ||
      !parent ||
      parent.org_id !== organizationId ||
      parent.job !== jobId
    ) {
      return "parent";
    }
  }

  return null;
}
