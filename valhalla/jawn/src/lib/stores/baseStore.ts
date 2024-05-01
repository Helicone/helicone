import pgPromise from "pg-promise";

export class BaseStore {
  constructor(
    protected organizationId: string,
    protected transaction?: pgPromise.ITask<{}>
  ) {}
}
