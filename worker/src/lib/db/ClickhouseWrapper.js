import { createClient } from "@clickhouse/client-web";
import dateFormat from "dateformat";
export class ClickhouseClientWrapper {
    clickHouseClient;
    constructor(env) {
        this.clickHouseClient = createClient({
            host: env.CLICKHOUSE_HOST,
            username: env.CLICKHOUSE_USER,
            password: env.CLICKHOUSE_PASSWORD,
        });
    }
    async dbInsertClickhouse(table, values) {
        try {
            const queryResult = await this.clickHouseClient.insert({
                table: table,
                values: values,
                format: "JSONEachRow",
                // Recommended for cluster usage to avoid situations
                // where a query processing error occurred after the response code
                // and HTTP headers were sent to the client.
                // See https://clickhouse.com/docs/en/interfaces/http/#response-buffering
                clickhouse_settings: {
                    async_insert: 1,
                    wait_end_of_query: 1,
                },
            });
            return { data: queryResult.query_id, error: null };
        }
        catch (err) {
            console.error("dbInsertClickhouseError", err);
            return {
                data: null,
                error: JSON.stringify(err),
            };
        }
    }
    async dbUpdateClickhouse(query) {
        try {
            const commandResult = await this.clickHouseClient.command({
                query,
                // Recommended for cluster usage to avoid situations
                // where a query processing error occurred after the response code
                // and HTTP headers were sent to the client.
                // See https://clickhouse.com/docs/en/interfaces/http/#response-buffering
                clickhouse_settings: {
                    wait_end_of_query: 1,
                },
            });
            return { data: commandResult.query_id, error: null };
        }
        catch (error) {
            console.error("dbUpdateClickhouseError", error);
            return {
                data: null,
                error: JSON.stringify(error),
            };
        }
    }
    async dbQuery(query, parameters) {
        try {
            const query_params = paramsToValues(parameters);
            const queryResult = await this.clickHouseClient.query({
                query,
                query_params,
                format: "JSONEachRow",
                // Recommended for cluster usage to avoid situations
                // where a query processing error occurred after the response code
                // and HTTP headers were sent to the client.
                // See https://clickhouse.com/docs/en/interfaces/http/#response-buffering
                clickhouse_settings: {
                    wait_end_of_query: 1,
                },
            });
            return { data: await queryResult.json(), error: null };
        }
        catch (err) {
            console.error("Error executing query: ", query, parameters);
            console.error(err);
            return {
                data: null,
                error: JSON.stringify(err),
            };
        }
    }
}
function paramsToValues(params) {
    return params
        .map((p) => {
        if (p instanceof Date) {
            //ex: 2023-05-27T08:21:26
            return dateFormat(p, "yyyy-mm-dd HH:MM:ss", true);
        }
        else {
            return p;
        }
    })
        .reduce((acc, parameter, index) => {
        return {
            ...acc,
            [`val_${index}`]: parameter,
        };
    }, {});
}
