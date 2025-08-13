env "dev" {
  url = env("DATABASE_URL")
  migration {
    dir = "file://atlas_migrations"
  }
}
