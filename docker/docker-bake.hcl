# Buildx Bake definitions for Helicone images

# Minimal targets with contexts and dockerfiles; tags and platforms will be set via --set from the script

target "web" {
  context    = ".."
  dockerfile = "docker/dockerfiles/dockerfile_web"
}

target "jawn" {
  context    = ".."
  dockerfile = "docker/dockerfiles/dockerfile_jawn"
}

target "migrations" {
  context    = ".."
  dockerfile = "docker/dockerfiles/dockerfile_migrations"
}

target "all_in_one" {
  context    = ".."
  dockerfile = "Dockerfile"
}
