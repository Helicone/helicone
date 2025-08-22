export async function safePut({
  key,
  keyName,
  value,
  options,
  maxRetries = 3,
  currentRetry = 0,
  baseDelay = 1_000,
}: {
  key: KVNamespace;
  keyName: string;
  value: string;
  options?: KVNamespacePutOptions;
  maxRetries?: number;
  currentRetry?: number;
  baseDelay?: number;
}): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await key.put(keyName, value, options);
    return { success: true };
  } catch (e) {
    console.log(
      `Error putting in cache (attempt ${currentRetry + 1}/${maxRetries})`,
      e
    );
    if (currentRetry >= maxRetries) {
      return { success: false, error: JSON.stringify(e) };
    }

    const delay = Math.floor(
      baseDelay * Math.pow(2, currentRetry) * (0.5 + Math.random())
    );

    await new Promise((resolve) => setTimeout(resolve, delay));

    return safePut({
      key,
      keyName,
      value,
      options,
      maxRetries,
      currentRetry: currentRetry + 1,
      baseDelay,
    });
  }
}
