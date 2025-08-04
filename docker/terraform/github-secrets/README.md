# GitHub Secrets Management for Docker Hub

This Terraform module manages GitHub repository secrets for Docker Hub authentication, enabling automated Docker image pushes via GitHub Actions.

## Overview

This module creates:
- GitHub repository secrets for Docker Hub credentials (`DOCKER_USERNAME` and `DOCKER_PASSWORD`)
- Works with the GitHub Actions workflow at `.github/workflows/docker-push.yml`

## Prerequisites

1. **GitHub Personal Access Token**: Create a token with `repo` permissions at https://github.com/settings/tokens
2. **Docker Hub Account**: You need Docker Hub credentials (username and password/access token)
3. **Terraform**: Version 1.0 or higher

## Usage

1. Copy `terraform.tfvars.example` to `terraform.tfvars`:
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   ```

2. Set your GitHub token:
   ```bash
   export GITHUB_TOKEN="ghp_your_token_here"
   ```

3. Set Docker Hub credentials (recommended):
   ```bash
   export TF_VAR_docker_username="your-dockerhub-username"
   export TF_VAR_docker_password="your-dockerhub-password-or-token"
   ```

   Alternatively, you can set them in `terraform.tfvars` (less secure).

4. Update `terraform.tfvars` with your values:
   - `github_org`: Your GitHub organization
   - `github_repository`: Your repository name

5. Initialize and apply:
   ```bash
   terraform init
   terraform plan
   terraform apply
   ```

## Security Considerations

- **Never commit credentials**: Always use environment variables for sensitive values
- **Use Docker Hub access tokens**: Instead of passwords, use access tokens from https://hub.docker.com/settings/security
- **Rotate credentials regularly**: Update tokens periodically for security

## GitHub Actions Workflow

The workflow at `.github/workflows/docker-push.yml` will:
1. Trigger on merges to the `main` branch
2. Use the Docker Hub credentials from GitHub secrets
3. Run the `docker/push_docker.sh` script with `--mode dockerhub`

## Testing

After applying Terraform:
1. Check GitHub repository settings to verify secrets are created
2. Make a test commit to the `main` branch
3. Monitor the GitHub Actions tab for the workflow execution