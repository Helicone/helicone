variable "image_url" {
  description = "The ECR image URL for the App Runner service"
  type        = string
}

variable "supabase_creds_secret_arn" {
    description = "The ARN of the Supabase credentials secret"
    type        = string
}