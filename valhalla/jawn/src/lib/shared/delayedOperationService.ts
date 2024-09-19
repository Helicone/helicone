export class DelayedOperationService {
  private static instance: DelayedOperationService;
  private delayedOperations: Map<NodeJS.Timeout, () => Promise<any>> =
    new Map();
  private static readonly SHUTDOWN_TIMEOUT = 60000; // 60 seconds timeout

  public static getInstance(): DelayedOperationService {
    if (!DelayedOperationService.instance) {
      DelayedOperationService.instance = new DelayedOperationService();
    }
    return DelayedOperationService.instance;
  }

  public addDelayedOperation(
    timeoutId: NodeJS.Timeout,
    operation: () => Promise<any>
  ): void {
    this.delayedOperations.set(timeoutId, operation);
  }

  public static getTimeoutId(
    operation: () => Promise<any>,
    delayMs: number
  ): NodeJS.Timeout {
    return setTimeout(() => {
      operation().catch((error) => {
        console.error("Error in delayed operation:", error);
      });
    }, delayMs);
  }

  public async executeShutdown(): Promise<void> {
    console.log("Executing shutdown handlers...");
    try {
      // Clear all timeouts and collect operations
      const operations = Array.from(this.delayedOperations.entries());
      this.delayedOperations.clear();

      for (const [timeoutId, operation] of operations) {
        clearTimeout(timeoutId);
      }

      // Execute delayed operations
      await Promise.all([
        Promise.all(
          operations.map(([timeoutId, op]) =>
            op()
              .catch((error) => {
                console.error("Error in delayed operation:", error);
              })
              .finally(() => {
                this.removeDelayedOperation(timeoutId);
              })
          )
        ),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Shutdown timed out")),
            DelayedOperationService.SHUTDOWN_TIMEOUT
          )
        ),
      ]);

      console.log("All shutdown handlers executed successfully.");
    } catch (error) {
      console.error("Error during shutdown:", error);
      console.log("Shutdown process completed with errors or timed out.");
    }
  }
  public removeDelayedOperation(timeoutId: NodeJS.Timeout): void {
    this.delayedOperations.delete(timeoutId);
  }
}
