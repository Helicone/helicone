import { PromiseGenericResult, err, ok } from "../modules/result";
import { ClickhouseDB, dbInsertClickhouse } from "../shared/db/dbExecute";

export class RequestResponseStore {
  constructor() {}

  async insertRequestResponseLog(
    requestResponseLog: ClickhouseDB["Tables"]["request_response_log"][]
  ): PromiseGenericResult<string> {
    const result = await dbInsertClickhouse(
      "request_response_log",
      requestResponseLog
    );

    if (result.error || !result.data) {
      return err(`Error inserting request response logs: ${result.error}`);
    }

    return ok(result.data);
  }

  async insertPropertiesV3(
    propertiesV3: ClickhouseDB["Tables"]["properties_v3"][]
  ): PromiseGenericResult<string> {
    const result = await dbInsertClickhouse("properties_v3", propertiesV3);

    if (result.error || !result.data) {
      return err(`Error inserting properties v3: ${result.error}`);
    }

    return ok(result.data);
  }

  async insertPropertyWithResponseV1(
    propertyWithResponseV1: ClickhouseDB["Tables"]["property_with_response_v1"][]
  ): PromiseGenericResult<string> {
    const result = await dbInsertClickhouse(
      "property_with_response_v1",
      propertyWithResponseV1
    );

    if (result.error || !result.data) {
      return err(`Error inserting property with response v1: ${result.error}`);
    }

    return ok(result.data);
  }
}
