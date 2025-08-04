#################################################################################
# General Configuration
#################################################################################


variable "resource_prefix" {
  description = "Prefix for AWS resource names"
  type        = string
  default     = "helicone"

  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.resource_prefix))
    error_message = "Resource prefix must contain only lowercase letters, numbers, and hyphens."
  }
}


variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default = {
    Project     = "Helicone"
    Environment = "production"
    ManagedBy   = "Terraform"
  }
}

#################################################################################
# Docker Hub Configuration
#################################################################################

variable "docker_username" {
  description = "Docker Hub username"
  type        = string
  sensitive   = true
}

variable "docker_password" {
  description = "Docker Hub password or access token"
  type        = string
  sensitive   = true
}

#################################################################################
# GitHub Configuration
#################################################################################

variable "github_org" {
  description = "GitHub organization name"
  type        = string

  validation {
    condition     = can(regex("^[a-zA-Z0-9-]+$", var.github_org))
    error_message = "GitHub organization must contain only alphanumeric characters and hyphens."
  }
}

variable "github_repository" {
  description = "GitHub repository name (without org prefix)"
  type        = string

  validation {
    condition     = can(regex("^[a-zA-Z0-9._-]+$", var.github_repository))
    error_message = "GitHub repository name must contain only alphanumeric characters, dots, underscores, and hyphens."
  }
}

variable "manage_repository_settings" {
  description = "Whether to manage GitHub repository settings via Terraform"
  type        = bool
  default     = false
}

variable "repository_visibility" {
  description = "GitHub repository visibility (public, private, internal)"
  type        = string
  default     = "private"

  validation {
    condition     = contains(["public", "private", "internal"], var.repository_visibility)
    error_message = "Repository visibility must be 'public', 'private', or 'internal'."
  }
}

 