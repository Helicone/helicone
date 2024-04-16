import { Result } from "../lib/shared/result";

export class LogManager {
  constructor() {}

  public logBatch(batch: any): Promise<Result<string, void>> {
    // Authenticate each log entry in the batch & only log if authenticated
  }
}
