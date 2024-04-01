# `@miniflare/d1`

Workers D1 module for [Miniflare](https://github.com/cloudflare/miniflare): a
fun, full-featured, fully-local simulator for Cloudflare Workers. See
[📦 D1](https://miniflare.dev/storage/d1) for more details.

## Example

```js
import { BetaDatabase } from "@miniflare/d1";
import { createSQLiteDB } from "@miniflare/shared";

const db = new BetaDatabase(await createSQLiteDB(":memory:"));
await db.exec(
  `CREATE TABLE my_table (cid INTEGER PRIMARY KEY, name TEXT NOT NULL);`
);
const response = await db.prepare(`SELECT * FROM sqlite_schema`).all();
console.log(await response);
/*
{
  "success": true,
  "results": [
    {
      "type": "table",
      "name": "my_table",
      "tbl_name": "my_table",
      "rootpage": 2,
      "sql": "CREATE TABLE my_table (cid INTEGER PRIMARY KEY, name TEXT NOT NULL)"
    }
  ],
  ...
}
*/
```
