env "dev" {
  # Example: clickhouse://default:password@localhost:8123
  url = env("CLICKHOUSE_URL")
  migration {
    dir = "file://migrations"
  }
}


