# Data sources
# Data sources
# Removed unused AWS data sources - not needed for GitHub secrets management

locals {
  # Removed unused AWS-specific locals
}

#################################################################################
# GitHub Repository Secrets
#################################################################################

# Docker Hub Username
resource "github_actions_secret" "docker_username" {
  repository      = var.github_repository
  secret_name     = "DOCKER_USERNAME"
  plaintext_value = var.docker_username
}

# Docker Hub Password
resource "github_actions_secret" "docker_password" {
  repository      = var.github_repository
  secret_name     = "DOCKER_PASSWORD"
  plaintext_value = var.docker_password
}


#################################################################################
# Optional: GitHub Repository Settings
#################################################################################

# Configure repository settings if enabled
resource "github_repository" "main" {
  count = var.manage_repository_settings ? 1 : 0

  name        = var.github_repository
  description = "Helicone - Open-source LLM observability platform"
  
  visibility = var.repository_visibility
  
  # Security settings
  vulnerability_alerts                    = true
  delete_branch_on_merge                 = true
  allow_merge_commit                     = true
  allow_squash_merge                     = true
  allow_rebase_merge                     = false
  allow_auto_merge                       = true
  squash_merge_commit_title              = "PR_TITLE"
  squash_merge_commit_message            = "PR_BODY"
  
  # Branch protection will be handled separately
  has_issues      = true
  has_projects    = true
  has_wiki        = false
  has_downloads   = false
  
  topics = [
    "helicone",
    "llm",
    "observability",
    "monitoring",
    "docker"
  ]
}

# Branch protection for main branch
resource "github_branch_protection" "main" {
  count = var.manage_repository_settings ? 1 : 0

  repository_id = github_repository.main[0].node_id
  pattern       = "main"

  required_status_checks {
    strict = true
    contexts = [
      "docker-push"  # Docker Hub push workflow
    ]
  }

  required_pull_request_reviews {
    required_approving_review_count = 1
    require_code_owner_reviews      = true
    dismiss_stale_reviews          = true
    restrict_dismissals            = false
  }

  enforce_admins         = false
  allows_deletions       = false
  allows_force_pushes    = false
  require_signed_commits = false
} 