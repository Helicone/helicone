// Pull all creds in at global state, if does not exist, throw error:
if ((process.env.S3_ENABLED ?? "true") === "true") {
  if (!process.env.S3_ACCESS_KEY) {
    throw new Error("No S3 access key");
  }

  if (!process.env.S3_SECRET_KEY) {
    throw new Error("No S3 secret key");
  }

  if (!process.env.S3_ENDPOINT) {
    // This is acceptable as it is optional.
    // If no endpoint is provided, the SDK will use the default endpoint.
  }

  if (!process.env.S3_BUCKET_NAME) {
    throw new Error("No S3 bucket name");
  }
}
if (
  !process.env.SUPABASE_CREDS ||
  (process.env.SUPABASE_URL && !process.env.SUPABASE_SERVICE_ROLE_KEY)
) {
  throw new Error("No Supabase creds");
}
