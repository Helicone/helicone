import { Worker } from "worker_threads";
import { ShutdownManager } from "../managers/shutdown/ShutdownService";

export class ConsumerManager {
  private static instance: ConsumerManager;
  private workers: Worker[] = [];

  private constructor() {
    // Register shutdown handler
    ShutdownManager.getInstance().addHandler(() => this.shutdown());
  }

  public static getInstance(): ConsumerManager {
    if (!ConsumerManager.instance) {
      ConsumerManager.instance = new ConsumerManager();
    }
    return ConsumerManager.instance;
  }

  public addWorker(worker: Worker) {
    this.workers.push(worker);
  }

  public async shutdown(): Promise<void> {
    console.log(`Shutting down ${this.workers.length} worker threads...`);
    const stopPromises = this.workers.map((worker) => {
      return new Promise<void>((resolve, reject) => {
        worker.once("exit", (code) => {
          resolve();
        });
        worker.once("error", (error) => {
          console.error("Worker error:", error);
          reject(error);
        });
        // Send a shutdown signal to the worker
        worker.postMessage("shutdown");

        // If worker doesn't exit after a timeout, terminate it forcefully
        setTimeout(() => {
          worker.terminate();
          resolve();
        }, 10000); // 10 seconds timeout
      });
    });
    await Promise.all(stopPromises);
    console.log("All worker threads shut down.");
  }
}
