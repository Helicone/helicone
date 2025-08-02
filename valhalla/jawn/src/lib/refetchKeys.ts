export const MAX_RETRIES = 3;
export async function refetchProviderKeys(retries = MAX_RETRIES) {
  try {
    const res = await fetch(
      `${process.env.HELICONE_WORKER_API}/refetch-provider-keys`
    );
    if (!res.ok) {
      console.error(res);
      if (retries > 0) {
        await new Promise((resolve) =>
          setTimeout(resolve, 10_000 * (MAX_RETRIES - retries))
        );
        await refetchProviderKeys(retries - 1);
      }
    }
  } catch (e) {
    console.error(e);
  }
}

export async function refetchAPIKeys(retries = MAX_RETRIES) {
  try {
    const res = await fetch(
      `${process.env.HELICONE_WORKER_API}/refetch-api-keys`
    );
    if (!res.ok) {
      console.error(res);
      if (retries > 0) {
        await new Promise((resolve) =>
          setTimeout(resolve, 10_000 * (MAX_RETRIES - retries))
        );
        await refetchAPIKeys(retries - 1);
      }
    }
  } catch (e) {
    console.error(e);
  }
}
