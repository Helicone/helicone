import { Result } from "../../../packages/common/result";
import { ClickhouseDB } from "../ClickhouseWrapper";

/**
 * Common interface for ClickHouse wrappers (both mock and real implementations)
 */
export interface IClickhouseWrapper {
  dbInsertClickhouse<T extends keyof ClickhouseDB["Tables"]>(
    table: T,
    values: ClickhouseDB["Tables"][T][]
  ): Promise<Result<string, string>>;

  dbQuery<RowType>(
    query: string,
    parameters: (number | string | boolean | Date)[]
  ): Promise<Result<RowType[], string>>;

  dbQueryHql<RowType>(
    query: string,
    parameters: (number | string | boolean | Date)[]
  ): Promise<Result<RowType[], string>>;

  queryWithContext<RowType>(params: {
    query: string;
    organizationId: string;
    parameters: (number | string | boolean | Date)[];
  }): Promise<Result<RowType[], string>>;

  createTestDatabase(): Promise<Result<null, string>>;
  dropTestDatabase(): Promise<Result<null, string>>;
  createTables(): Promise<Result<null, string>>;
  dropTables(): Promise<Result<null, string>>;
  insertTestData(): Promise<Result<null, string>>;
}

export interface ClickhouseEnv {
  CLICKHOUSE_HOST: string;
  CLICKHOUSE_USER: string;
  CLICKHOUSE_PASSWORD: string;
  CLICKHOUSE_HQL_USER: string;
  CLICKHOUSE_HQL_PASSWORD: string;
}