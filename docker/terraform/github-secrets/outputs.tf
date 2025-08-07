#################################################################################
# GitHub Repository Secrets Outputs
#################################################################################

output "github_repository_secrets" {
  description = "List of GitHub repository secrets created"
  value = [
    "DOCKER_PASSWORD",
    length(var.docker_build_cloud_token) > 0 ? "DOCKER_BUILD_CLOUD_TOKEN" : null
  ]
  sensitive = true
}

output "github_repository_variables" {
  description = "List of GitHub repository variables created"
  value = [
    "DOCKER_USERNAME"
  ]
}

#################################################################################
# Helper Information
#################################################################################

output "repository_full_name" {
  description = "Full GitHub repository name (org/repo)"
  value       = "${var.github_org}/${var.github_repository}"
}

#################################################################################
# Next Steps Information
#################################################################################

output "next_steps" {
  description = "Next steps to complete the setup"
  value = {
    workflow_file = "GitHub Actions workflow created at .github/workflows/docker-push.yml"
    test_workflow = "Workflow will run automatically on merge to main"
    verify_secrets = "Ensure DOCKER_USERNAME and DOCKER_PASSWORD secrets are set in GitHub repository settings"
    manual_run = "To test manually: gh workflow run docker-push.yml"
  }
}