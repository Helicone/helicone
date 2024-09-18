type ShutdownHandler = () => Promise<void>;

export class ShutdownManager {
  private static instance: ShutdownManager;
  private handlers: ShutdownHandler[] = [];
  private static readonly SHUTDOWN_TIMEOUT = 60000; // 60 seconds timeout

  private constructor() {}

  public static getInstance(): ShutdownManager {
    if (!ShutdownManager.instance) {
      ShutdownManager.instance = new ShutdownManager();
    }
    return ShutdownManager.instance;
  }

  public addHandler(handler: ShutdownHandler): void {
    this.handlers.push(handler);
  }

  public async executeShutdown(): Promise<void> {
    console.log("Executing shutdown handlers...");
    try {
      await Promise.all([
        Promise.all(this.handlers.map((handler) => handler())),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Shutdown timed out")),
            ShutdownManager.SHUTDOWN_TIMEOUT
          )
        ),
      ]);
      console.log("All shutdown handlers executed successfully.");
    } catch (error) {
      console.error("Error during shutdown:", error);
      console.log("Shutdown process completed with errors or timed out.");
    }
  }
}
