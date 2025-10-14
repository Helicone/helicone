import { MAX_RETRIES } from "./refetchKeys";
import { removeSecureCacheEntries } from "./clients/cloudflareKV";
import { ENVIRONMENT } from "./clients/constant";

type ResetPromptCacheParams = {
  orgId: string;
  promptId: string;
  versionId?: string;
  environment?: string;
};

const buildPromptCacheKeys = ({
  orgId,
  promptId,
  versionId,
  environment,
}: ResetPromptCacheParams): string[] => {
  const keys = new Set<string>();

  // Default production scope
  if (!versionId && !environment) {
    keys.add(`prompt_version_${promptId}_prod_${orgId}`);
  }

  if (versionId) {
    keys.add(`prompt_version_${promptId}_version:${versionId}_${orgId}`);
    keys.add(`prompt_body_${promptId}_${versionId}_${orgId}`);
    keys.add(`prompt_version_${promptId}_prod_${orgId}`);
  }

  if (environment) {
    keys.add(`prompt_version_${promptId}_env:${environment}_${orgId}`);
    if (environment === "production") {
      keys.add(`prompt_version_${promptId}_prod_${orgId}`);
    }
  }

  return Array.from(keys);
};

async function resetPromptCacheDev(
  { orgId, promptId, versionId, environment }: ResetPromptCacheParams,
  retries = MAX_RETRIES
) {
  try {
    const res = await fetch(
      `${process.env.HELICONE_WORKER_API}/reset-prompt-cache/${orgId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          promptId,
          versionId,
          environment,
        }),
      }
    );

    if (!res.ok) {
      console.error(res);
      if (retries > 0) {
        await new Promise((resolve) =>
          setTimeout(resolve, 10_000 * (MAX_RETRIES - retries))
        );
        await resetPromptCacheDev(
          { orgId, promptId, versionId, environment },
          retries - 1
        );
      }
    }
  } catch (error) {
    console.error(error);
    if (retries > 0) {
      await new Promise((resolve) =>
        setTimeout(resolve, 10_000 * (MAX_RETRIES - retries))
      );
      await resetPromptCacheDev(
        { orgId, promptId, versionId, environment },
        retries - 1
      );
    }
  }
}

export async function resetPromptCache(
  params: ResetPromptCacheParams
): Promise<void> {
  if (!params.promptId || !params.orgId) {
    console.warn("Missing promptId or orgId when resetting prompt cache.");
    return;
  }

  if (ENVIRONMENT === "production") {
    const cacheKeys = buildPromptCacheKeys(params);
    if (cacheKeys.length === 0) {
      return;
    }
    await removeSecureCacheEntries(cacheKeys);
    return;
  }

  await resetPromptCacheDev(params);
}
