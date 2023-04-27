
CREATE TABLE default.test_table
(
   `id` Int64,
   `hello` String,
)
ENGINE = MergeTree
PRIMARY KEY (id)
ORDER BY (id);