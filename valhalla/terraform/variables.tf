variable "image_url" {
  description = "The ECR image URL for the App Runner service"
  type        = string
}

variable "supabase_creds_secret_arn" {
    description = "The ARN of the Supabase credentials secret"
    type        = string
}

variable "jump_host_key" {
    description = "Name of Key Pair in EC2 that will be used as a jump host"
    type        = string
}

variable "jump_cidr_blocks" {
    description = "Client IP address that will be allowed to connect to the jump host"
    type        = string
}