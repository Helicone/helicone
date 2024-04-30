import { ClickhouseClientWrapper, ClickhouseDB } from "../db/ClickhouseWrapper";
import { PromiseGenericResult, err, ok } from "../shared/result";

export class RequestResponseStore {
  private clickhouse: ClickhouseClientWrapper;

  constructor(clickhouse: ClickhouseClientWrapper) {
    this.clickhouse = clickhouse;
  }

  async insertRequestResponseVersioned(
    requestResponseLog: ClickhouseDB["Tables"]["request_response_versioned"][]
  ): PromiseGenericResult<string> {
    const result = await this.clickhouse.dbInsertClickhouse(
      "request_response_versioned",
      requestResponseLog
    );

    if (result.error || !result.data) {
      return err(`Error inserting request response logs: ${result.error}`);
    }

    return ok(result.data);
  }
}
